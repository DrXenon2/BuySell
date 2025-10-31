-- Fonction pour mettre à jour le statut d'une commande
-- Gère les transitions d'état et les notifications

CREATE OR REPLACE FUNCTION update_order_status(
  order_id BIGINT,
  new_status TEXT,
  admin_notes TEXT DEFAULT NULL,
  tracking_number TEXT DEFAULT NULL,
  updated_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  old_status TEXT;
  user_record RECORD;
  status_result JSON;
  valid_transition BOOLEAN;
  notification_title TEXT;
  notification_message TEXT;
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

  old_status := order_record.status;

  -- Valider la transition de statut
  valid_transition := validate_order_status_transition(old_status, new_status);
  
  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Transition de statut invalide: % -> %', old_status, new_status;
  END IF;

  -- Mettre à jour la commande
  UPDATE orders 
  SET 
    status = new_status,
    admin_notes = COALESCE(admin_notes, admin_notes),
    tracking_number = COALESCE(tracking_number, tracking_number),
    status_updated_at = NOW(),
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
      'last_status_update_by', updated_by,
      'status_history', COALESCE(metadata->'status_history', '[]'::JSONB) || 
        jsonb_build_object(
          'from_status', old_status,
          'to_status', new_status,
          'updated_at', NOW(),
          'updated_by', updated_by,
          'notes', admin_notes
        )
    )
  WHERE id = order_id;

  -- Gérer les actions spécifiques au statut
  CASE new_status
    WHEN 'confirmed' THEN
      -- Réduire les stocks
      PERFORM reduce_product_stock(order_id);
      
      -- Notifier le vendeur
      PERFORM notify_seller_new_order(order_id);
      
      notification_title := 'Commande confirmée! ✅';
      notification_message := 'Votre commande #' || order_record.order_number || ' a été confirmée et est en cours de préparation.';

    WHEN 'shipped' THEN
      notification_title := 'Commande expédiée! 🚚';
      notification_message := 'Votre commande #' || order_record.order_number || ' a été expédiée.';
      
      IF tracking_number IS NOT NULL THEN
        notification_message := notification_message || ' Numéro de suivi: ' || tracking_number;
      END IF;

    WHEN 'delivered' THEN
      -- Marquer comme livrée et calculer la date de livraison
      UPDATE orders 
      SET delivered_at = NOW() 
      WHERE id = order_id;
      
      notification_title := 'Commande livrée! 🎉';
      notification_message := 'Votre commande #' || order_record.order_number || ' a été livrée avec succès.';

    WHEN 'cancelled' THEN
      -- Restaurer les stocks
      PERFORM restore_product_stock(order_id);
      
      notification_title := 'Commande annulée ❌';
      notification_message := 'Votre commande #' || order_record.order_number || ' a été annulée.';

    WHEN 'refunded' THEN
      -- Traiter le remboursement
      PERFORM process_order_refund(order_id);
      
      notification_title := 'Remboursement effectué 💰';
      notification_message := 'Votre commande #' || order_record.order_number || ' a été remboursée.';

    ELSE
      notification_title := 'Statut de commande mis à jour';
      notification_message := 'Le statut de votre commande #' || order_record.order_number || ' est maintenant: ' || new_status;
  END CASE;

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
    'ORDER_STATUS_UPDATED',
    notification_title,
    notification_message,
    '/orders/' || order_id,
    'Voir la commande',
    'medium',
    NOW()
  );

  -- Journaliser le changement
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    COALESCE(updated_by, order_record.user_id),
    'ORDER_STATUS_UPDATED',
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'from_status', old_status,
      'to_status', new_status,
      'tracking_number', tracking_number
    ),
    NOW()
  );

  -- Créer un événement d'analytique
  INSERT INTO analytics_events (
    user_id,
    event_type,
    event_name,
    details,
    created_at
  ) VALUES (
    order_record.user_id,
    'order',
    'status_updated',
    jsonb_build_object(
      'order_id', order_id,
      'old_status', old_status,
      'new_status', new_status
    ),
    NOW()
  );

  status_result := jsonb_build_object(
    'success', true,
    'order_id', order_id,
    'old_status', old_status,
    'new_status', new_status,
    'message', 'Statut mis à jour avec succès'
  );

  RETURN status_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'update_order_status',
      SQLERRM,
      COALESCE(updated_by, order_record.user_id),
      jsonb_build_object(
        'order_id', order_id,
        'new_status', new_status
      ),
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Fonction de validation des transitions de statut
CREATE OR REPLACE FUNCTION validate_order_status_transition(
  old_status TEXT,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Définir les transitions autorisées
  RETURN CASE
    WHEN old_status = 'pending' AND new_status IN ('confirmed', 'cancelled') THEN true
    WHEN old_status = 'confirmed' AND new_status IN ('processing', 'cancelled') THEN true
    WHEN old_status = 'processing' AND new_status IN ('shipped', 'cancelled') THEN true
    WHEN old_status = 'shipped' AND new_status IN ('delivered', 'cancelled') THEN true
    WHEN old_status = 'delivered' AND new_status IN ('refunded') THEN true
    WHEN old_status = 'cancelled' AND new_status IN ('confirmed') THEN true -- Réactivation
    ELSE false
  END;
END;
$$;

-- Fonction pour réduire les stocks
CREATE OR REPLACE FUNCTION reduce_product_stock(order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products p
  SET quantity = quantity - oi.quantity,
      updated_at = NOW()
  FROM order_items oi
  WHERE p.id = oi.product_id 
    AND oi.order_id = reduce_product_stock.order_id
    AND p.track_quantity = true;
END;
$$;

-- Fonction pour restaurer les stocks
CREATE OR REPLACE FUNCTION restore_product_stock(order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products p
  SET quantity = quantity + oi.quantity,
      updated_at = NOW()
  FROM order_items oi
  WHERE p.id = oi.product_id 
    AND oi.order_id = restore_product_stock.order_id
    AND p.track_quantity = true;
END;
$$;
