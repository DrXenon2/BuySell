-- Fonction pour gérer les webhooks de paiement
-- Traite les événements Stripe et autres processeurs

CREATE OR REPLACE FUNCTION handle_payment_webhook(
  webhook_secret TEXT,
  webhook_payload JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_type TEXT;
  event_data JSONB;
  payment_intent_id TEXT;
  payment_record RECORD;
  webhook_result JSON;
  signature_valid BOOLEAN;
BEGIN
  -- Vérifier la signature du webhook (simplifié)
  -- En production, utiliser la vérification HMAC de Stripe
  signature_valid := verify_webhook_signature(webhook_secret, webhook_payload);
  
  IF NOT signature_valid THEN
    RAISE EXCEPTION 'Signature de webhook invalide';
  END IF;

  event_type := webhook_payload->>'type';
  event_data := webhook_payload->'data'->'object';

  -- Journaliser la réception du webhook
  INSERT INTO webhook_logs (
    provider,
    event_type,
    payload,
    processed,
    created_at
  ) VALUES (
    'stripe',
    event_type,
    webhook_payload,
    false,
    NOW()
  );

  CASE event_type
    WHEN 'payment_intent.succeeded' THEN
      payment_intent_id := event_data->>'id';
      
      -- Récupérer le paiement
      SELECT * INTO payment_record 
      FROM payments 
      WHERE payment_intent_id = payment_intent_id;
      
      IF FOUND THEN
        -- Mettre à jour le statut du paiement
        UPDATE payments 
        SET 
          status = 'succeeded',
          transaction_id = event_data->>'charges'->'data'->0->>'id',
          processed_at = NOW(),
          updated_at = NOW(),
          metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
            'stripe_event', event_type,
            'payment_method_details', event_data->'payment_method_details'
          )
        WHERE payment_intent_id = payment_intent_id;

        -- Mettre à jour la commande
        UPDATE orders 
        SET 
          status = 'confirmed',
          paid_at = NOW(),
          updated_at = NOW()
        WHERE id = payment_record.order_id;

        -- Notifier l'utilisateur
        PERFORM notify_payment_success(payment_record.user_id, payment_record.order_id, payment_record.amount);

        webhook_result := json_build_object(
          'processed', true,
          'action', 'payment_succeeded',
          'payment_id', payment_record.id
        );
      END IF;

    WHEN 'payment_intent.payment_failed' THEN
      payment_intent_id := event_data->>'id';
      
      SELECT * INTO payment_record 
      FROM payments 
      WHERE payment_intent_id = payment_intent_id;
      
      IF FOUND THEN
        UPDATE payments 
        SET 
          status = 'failed',
          failure_message = event_data->>'last_payment_error'->>'message',
          updated_at = NOW(),
          metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
            'stripe_event', event_type,
            'error', event_data->'last_payment_error'
          )
        WHERE payment_intent_id = payment_intent_id;

        UPDATE orders 
        SET 
          status = 'payment_failed',
          updated_at = NOW()
        WHERE id = payment_record.order_id;

        PERFORM notify_payment_failed(payment_record.user_id, payment_record.order_id);

        webhook_result := json_build_object(
          'processed', true,
          'action', 'payment_failed',
          'payment_id', payment_record.id
        );
      END IF;

    WHEN 'charge.refunded' THEN
      -- Gérer les remboursements
      PERFORM handle_refund(event_data);

    ELSE
      -- Événement non géré
      webhook_result := json_build_object(
        'processed', false,
        'action', 'ignored',
        'reason', 'event_type_not_handled'
      );
  END CASE;

  -- Marquer le webhook comme traité
  UPDATE webhook_logs 
  SET 
    processed = true,
    processed_at = NOW(),
    result = webhook_result
  WHERE id = currval('webhook_logs_id_seq');

  RETURN webhook_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      details,
      created_at
    ) VALUES (
      'handle_payment_webhook',
      SQLERRM,
      json_build_object(
        'event_type', event_type,
        'payment_intent_id', payment_intent_id
      ),
      NOW()
    );
    
    RETURN json_build_object(
      'processed', false,
      'error', SQLERRM
    );
END;
$$;

-- Fonction helper pour vérifier la signature
CREATE OR REPLACE FUNCTION verify_webhook_signature(
  secret TEXT,
  payload JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implémentation simplifiée
  -- En production, utiliser la vérification HMAC de Stripe
  RETURN secret IS NOT NULL AND length(secret) > 0;
END;
$$;

-- Fonction pour notifier le succès de paiement
CREATE OR REPLACE FUNCTION notify_payment_success(
  user_id UUID,
  order_id BIGINT,
  amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
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
    user_id,
    'PAYMENT_SUCCESS',
    'Paiement confirmé! ✅',
    'Votre paiement de ' || amount || ' XOF a été traité avec succès.',
    '/orders/' || order_id,
    'Voir la commande',
    'high',
    NOW()
  );
END;
$$;

-- Fonction pour notifier l'échec de paiement
CREATE OR REPLACE FUNCTION notify_payment_failed(
  user_id UUID,
  order_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
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
    user_id,
    'PAYMENT_FAILED',
    'Échec du paiement ❌',
    'Le traitement de votre paiement a échoué. Veuillez réessayer.',
    '/checkout/' || order_id,
    'Réessayer',
    'high',
    NOW()
  );
END;
$$;
