-- Fonction pour traiter un paiement
-- Gère la confirmation et le traitement des paiements

CREATE OR REPLACE FUNCTION process_payment(
  payment_intent_id TEXT,
  payment_method_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record RECORD;
  order_record RECORD;
  user_record RECORD;
  processing_result JSON;
  transaction_id TEXT;
BEGIN
  -- Récupérer le paiement
  SELECT p.*, o.*, u.email as customer_email
  INTO payment_record
  FROM payments p
  JOIN orders o ON p.order_id = o.id
  JOIN users u ON p.user_id = u.id
  WHERE p.payment_intent_id = payment_intent_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intention de paiement non trouvée';
  END IF;

  -- Vérifier le statut
  IF payment_record.status NOT IN ('requires_payment_method', 'requires_confirmation') THEN
    RAISE EXCEPTION 'Paiement déjà traité: %', payment_record.status;
  END IF;

  -- Simuler le traitement du paiement
  -- En production, confirmer avec Stripe/API de paiement
  transaction_id := 'txn_' || encode(gen_random_bytes(16), 'hex');
  
  -- Déterminer le résultat basé sur une logique métier
  -- Ici on simule un succès dans 95% des cas
  IF random() < 0.95 THEN
    -- Paiement réussi
    UPDATE payments 
    SET 
      status = 'succeeded',
      payment_method_id = COALESCE(payment_method_id, 'pm_' || encode(gen_random_bytes(16), 'hex')),
      transaction_id = transaction_id,
      processed_at = NOW(),
      updated_at = NOW()
    WHERE id = payment_record.id;

    -- Mettre à jour la commande
    UPDATE orders 
    SET 
      status = 'confirmed',
      paid_at = NOW(),
      updated_at = NOW()
    WHERE id = payment_record.order_id;

    -- Créer la transaction financière
    INSERT INTO transactions (
      payment_id,
      user_id,
      type,
      amount,
      currency,
      status,
      gateway,
      gateway_transaction_id,
      metadata,
      created_at
    ) VALUES (
      payment_record.id,
      payment_record.user_id,
      'payment',
      payment_record.amount,
      'XOF',
      'completed',
      'stripe',
      transaction_id,
      json_build_object(
        'order_id', payment_record.order_id,
        'payment_method', payment_record.payment_method
      ),
      NOW()
    );

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
      payment_record.user_id,
      'PAYMENT_SUCCESS',
      'Paiement confirmé! ✅',
      'Votre paiement de ' || payment_record.amount || ' XOF a été traité avec succès.',
      '/orders/' || payment_record.order_id,
      'Voir la commande',
      'high',
      NOW()
    );

    -- Journaliser
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      created_at
    ) VALUES (
      payment_record.user_id,
      'PAYMENT_SUCCEEDED',
      'payment',
      payment_record.id,
      json_build_object(
        'amount', payment_record.amount,
        'transaction_id', transaction_id
      ),
      NOW()
    );

    processing_result := json_build_object(
      'success', true,
      'status', 'succeeded',
      'transaction_id', transaction_id,
      'message', 'Paiement traité avec succès'
    );

  ELSE
    -- Paiement échoué
    UPDATE payments 
    SET 
      status = 'failed',
      failure_message = 'Échec du traitement du paiement',
      updated_at = NOW()
    WHERE id = payment_record.id;

    UPDATE orders 
    SET 
      status = 'payment_failed',
      updated_at = NOW()
    WHERE id = payment_record.order_id;

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
      payment_record.user_id,
      'PAYMENT_FAILED',
      'Échec du paiement ❌',
      'Le traitement de votre paiement a échoué. Veuillez réessayer avec un autre moyen de paiement.',
      '/checkout/' || payment_record.order_id,
      'Réessayer',
      'high',
      NOW()
    );

    processing_result := json_build_object(
      'success', false,
      'status', 'failed',
      'error', 'Échec du traitement du paiement'
    );
  END IF;

  RETURN processing_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'process_payment',
      SQLERRM,
      payment_record.user_id,
      json_build_object('payment_intent_id', payment_intent_id),
      NOW()
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors du traitement du paiement'
    );
END;
$$;
