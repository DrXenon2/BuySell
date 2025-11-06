-- Fonction pour générer des codes promo en masse
-- Utile pour les campagnes marketing

CREATE OR REPLACE FUNCTION generate_coupon_batch(
  campaign_name TEXT,
  discount_type TEXT,
  discount_value DECIMAL,
  quantity INTEGER DEFAULT 100,
  prefix TEXT DEFAULT 'PROMO',
  code_length INTEGER DEFAULT 8,
  valid_days INTEGER DEFAULT 30,
  usage_limit INTEGER DEFAULT 1,
  user_usage_limit INTEGER DEFAULT 1,
  min_order_amount DECIMAL DEFAULT NULL,
  max_discount_amount DECIMAL DEFAULT NULL,
  first_order_only BOOLEAN DEFAULT false,
  applicable_product_ids BIGINT[] DEFAULT NULL,
  applicable_category_ids BIGINT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_count INTEGER := 0;
  coupon_code TEXT;
  coupon_codes TEXT[] := '{}';
  batch_result JSON;
BEGIN
  -- Valider les paramètres
  IF quantity > 1000 THEN
    RAISE EXCEPTION 'Impossible de générer plus de 1000 codes à la fois';
  END IF;

  IF discount_type NOT IN ('percentage', 'fixed', 'free_shipping') THEN
    RAISE EXCEPTION 'Type de réduction invalide. Doit être: percentage, fixed ou free_shipping';
  END IF;

  -- Générer les codes en lot
  FOR i IN 1..quantity LOOP
    -- Générer un code unique
    coupon_code := generate_unique_coupon_code(prefix, code_length);
    
    -- Insérer le coupon
    INSERT INTO coupons (
      code,
      name,
      description,
      discount_type,
      discount_value,
      max_discount_amount,
      usage_limit,
      user_usage_limit,
      min_order_amount,
      first_order_only,
      applicable_product_ids,
      applicable_category_ids,
      valid_from,
      valid_until,
      is_active,
      campaign_name,
      created_at,
      updated_at
    ) VALUES (
      coupon_code,
      campaign_name,
      'Code promo généré automatiquement pour la campagne: ' || campaign_name,
      discount_type,
      discount_value,
      max_discount_amount,
      usage_limit,
      user_usage_limit,
      min_order_amount,
      first_order_only,
      applicable_product_ids,
      applicable_category_ids,
      NOW(),
      NOW() + (valid_days || ' days')::INTERVAL,
      true,
      campaign_name,
      NOW(),
      NOW()
    );

    generated_count := generated_count + 1;
    coupon_codes := coupon_codes || coupon_code;
  END LOOP;

  -- Journaliser la génération
  INSERT INTO audit_logs (
    action,
    resource_type,
    details,
    created_at
  ) VALUES (
    'COUPON_BATCH_GENERATED',
    'coupon',
    json_build_object(
      'campaign_name', campaign_name,
      'quantity', quantity,
      'discount_type', discount_type,
      'discount_value', discount_value,
      'valid_days', valid_days
    ),
    NOW()
  );

  batch_result := json_build_object(
    'success', true,
    'generated_count', generated_count,
    'campaign_name', campaign_name,
    'coupon_codes', coupon_codes,
    'valid_until', (NOW() + (valid_days || ' days')::INTERVAL)::TEXT
  );

  RETURN batch_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      details,
      created_at
    ) VALUES (
      'generate_coupon_batch',
      SQLERRM,
      json_build_object(
        'campaign_name', campaign_name,
        'quantity', quantity
      ),
      NOW()
    );
    
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Fonction pour générer un code de coupon unique
CREATE OR REPLACE FUNCTION generate_unique_coupon_code(
  prefix TEXT DEFAULT 'PROMO',
  length INTEGER DEFAULT 8
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  WHILE attempts < max_attempts LOOP
    -- Générer la partie aléatoire
    result := prefix || '_';
    FOR i IN 1..length LOOP
      result := result || substr(characters, floor(random() * length(characters))::INTEGER + 1, 1);
    END LOOP;

    -- Vérifier l'unicité
    SELECT EXISTS(SELECT 1 FROM coupons WHERE code = result) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
  END LOOP;

  RAISE EXCEPTION 'Impossible de générer un code unique après % tentatives', max_attempts;
END;
$$;
