-- Fonction pour créer une intention de paiement
-- Gère la création sécurisée des paiements

CREATE OR REPLACE FUNCTION create_payment_intent(
  order_id BIGINT,
  payment_method TEXT DEFAULT 'card',
  save_payment_method BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  user_record RECORD;
  payment_intent_id TEXT;
  client_secret TEXT;
  amount_cents BIGINT;
  payment_data JSON;
  intent_result JSON;
BEGIN
  -- Récupérer les informations de la commande
  SELECT 
    o.*,
    u.email as customer_email,
    p.user_id as seller_id
  INTO order_record
  FROM orders o
  JOIN users u ON o.user_id = u.id
  JOIN products p ON o.id = p.id  -- Simplification, besoin d'une jointure réelle
  WHERE o.id = order_id AND o.status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commande non trouvée ou non éligible au paiement';
  END IF;

  -- Calculer le montant en centimes (Stripe)
  amount_cents := (order_record.total_amount * 100)::BIGINT;

  -- Générer un ID d'intention de paiement unique
  payment_intent_id := 'pi_' || encode(gen_random_bytes(16), 'hex');

  -- Simuler la création d'une intention de paiement Stripe
  -- En production, appeler l'API Stripe ici
  client_secret := 'seti_' || encode(gen_random_bytes(32), 'hex');

  -- Créer l'enregistrement de paiement
  INSERT INTO payments (
    order_id,
    user_id,
    payment_intent_id,
    client_secret,
    amount,
    currency,
    status,
    payment_method,
    save_payment_method,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    order_id,
    order_record.user_id,
    payment_intent_id,
    client_secret,
    order_record.total_amount,
    'XOF',
    'requires_payment_method',
    payment_method,
    save_payment_method,
    json_build_object(
      'order_number', order_record.order_number,
      'customer_email', order_record.customer_email,
      'items_count', order_record.items_count
    ),
    NOW(),
    NOW()
  )
  RETURNING * INTO payment_data;

  -- Journaliser la création
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    order_record.user_id,
    'PAYMENT_INTENT_CREATED',
    'payment',
    (payment_data->>'id')::BIGINT,
    json_build_object(
      'order_id', order_id,
      'amount', order_record.total_amount,
      'payment_method', payment_method
    ),
    NOW()
  );

  -- Retourner les données pour le client
  intent_result := json_build_object(
    'success', true,
    'payment_intent_id', payment_intent_id,
    'client_secret', client_secret,
    'amount', order_record.total_amount,
    'currency', 'XOF',
    'status', 'requires_payment_method'
  );

  RETURN intent_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'create_payment_intent',
      SQLERRM,
      order_record.user_id,
      json_build_object('order_id', order_id),
      NOW()
    );
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors de la création de l''intention de paiement'
    );
END;
$$;
