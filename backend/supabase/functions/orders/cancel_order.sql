-- Fonction pour annuler une commande
-- Gère l'annulation avec remboursement et restauration de stock

CREATE OR REPLACE FUNCTION cancel_order(
  order_id BIGINT,
  cancellation_reason TEXT,
  cancelled_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  payment_record RECORD;
  user_record RECORD;
  cancel_result JSON;
  refund_amount DECIMAL;
  can_cancel BOOLEAN;
BEGIN
  -- Récupérer la commande
  SELECT o.*, u.email, u.id as customer_id
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.id = order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commande non trouvée';
  END IF;

  -- Vérifier si la commande peut être annulée
  can_cancel := order_record.status IN ('pending', 'confirmed', 'processing');
  
  IF NOT can_cancel THEN
    RAISE EXCEPTION 'La commande ne peut pas être annulée dans son statut actuel: %', order_record.status;
  END IF;

  -- Récupérer le paiement associé
  SELECT * INTO payment_record 
  FROM payments 
  WHERE order_id = order_id AND status = 'succeeded';
  
  -- Calculer le montant du remboursement
  IF FOUND THEN
    -- Politique de remboursement: 100% si annulé rapidement, sinon des frais peuvent s'appliquer
    IF order_record.status = 'pending' OR 
       (order_record.created_at > NOW() - INTERVAL '1 hour') THEN
      refund_amount := order_record.total_amount;
    ELSE
      -- Appliquer des frais d'annulation de 10%
      refund_amount := order_record.total_amount * 0.9;
    END IF;
  END IF;

  -- Commencer la transaction
  BEGIN
    -- Mettre à jour le statut de la commande
    UPDATE orders 
    SET 
      status = 'cancelled',
      cancellation_reason = cancellation_reason,
      cancelled_by = cancelled_by,
      cancelled_at = NOW(),
      refund_amount = refund_amount,
      updated_at = NOW(),
      metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
        'cancellation_details', jsonb_build_object(
          'reason', cancellation_reason,
          'cancelled_by', cancelled_by,
          'refund_amount', refund_amount,
          'original_amount', order_record.total_amount
        )
      )
    WHERE id = order_id;

    -- Restaurer les stocks
    PERFORM restore_product_stock(order_id);

    -- Traiter le remboursement si nécessaire
    IF FOUND AND refund_amount > 0 THEN
      -- Marquer le paiement comme remboursé
      UPDATE payments 
      SET 
        status = 'refunded',
        refund_amount = refund_amount,
        refunded_at = NOW(),
        updated_at = NOW()
      WHERE order_id = order_id AND status = 'succeeded';

      -- Créer une transaction de remboursement
      INSERT INTO transactions (
        payment_id,
        user_id,
        type,
        amount,
        currency,
        status,
        gateway,
        metadata,
        created_at
      ) VALUES (
        payment_record.id,
        order_record.user_id,
        'refund',
        refund_amount,
        'XOF',
        'completed',
        'stripe',
        jsonb_build_object(
          'order_id', order_id,
          'cancellation_reason', cancellation_reason,
          'original_payment_id', payment_record.payment_intent_id
        ),
        NOW()
      );

      -- Journaliser le remboursement
      INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
      ) VALUES (
        COALESCE(cancelled_by, order_record.user_id),
        'ORDER_REFUNDED',
        'order',
        order_id,
        jsonb_build_object(
          'order_number', order_record.order_number,
          'refund_amount', refund_amount,
          'cancellation_reason', cancellation_reason
        ),
        NOW()
      );
    END IF;

    -- Notifier l'utilisateur
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      action_label,
      priority,
      created_at
    ) VALUES (
      order_record.user_id,
      'ORDER_CANCELLED',
      'Commande annulée ❌',
      'Votre commande #' || order_record.order_number || ' a été annulée. ' ||
      CASE 
        WHEN refund_amount > 0 THEN 'Un remboursement de ' || refund_amount || ' XOF sera traité.'
        ELSE 'Aucun remboursement applicable.'
      END,
      '/orders/' || order_id,
      'Voir les détails',
      'high',
      NOW()
    );

    -- Notifier les vendeurs concernés
    PERFORM notify_sellers_order_cancelled(order_id, cancellation_reason);

    -- Journaliser l'annulation
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      created_at
    ) VALUES (
      COALESCE(cancelled_by, order_record.user_id),
      'ORDER_CANCELLED',
      'order',
      order_id,
      jsonb_build_object(
        'order_number', order_record.order_number,
        'cancellation_reason', cancellation_reason,
        'refund_processed', refund_amount > 0
      ),
      NOW()
    );

    cancel_result := jsonb_build_object(
      'success', true,
      'order_id', order_id,
      'cancellation_reason', cancellation_reason,
      'refund_amount', refund_amount,
      'message', 'Commande annulée avec succès'
    );

  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END;

  RETURN cancel_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'cancel_order',
      SQLERRM,
      COALESCE(cancelled_by, order_record.user_id),
      jsonb_build_object(
        'order_id', order_id,
        'cancellation_reason', cancellation_reason
      ),
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Fonction pour notifier les vendeurs
CREATE OR REPLACE FUNCTION notify_sellers_order_cancelled(
  order_id BIGINT,
  cancellation_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  seller_record RECORD;
BEGIN
  FOR seller_record IN 
    SELECT DISTINCT p.user_id as seller_id
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = notify_sellers_order_cancelled.order_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      action_label,
      priority,
      created_at
    ) VALUES (
      seller_record.seller_id,
      'SELLER_ORDER_CANCELLED',
      'Commande annulée par le client',
      'Une commande contenant vos produits a été annulée. Raison: ' || cancellation_reason,
      '/seller/orders/' || order_id,
      'Voir la commande',
      'medium',
      NOW()
    );
  END LOOP;
END;
$$;
