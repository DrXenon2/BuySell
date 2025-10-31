-- Fonction pour valider un code promo
-- Vérifie l'éligibilité et calcule la réduction

CREATE OR REPLACE FUNCTION validate_coupon(
  coupon_code TEXT,
  user_id UUID DEFAULT NULL,
  order_amount DECIMAL DEFAULT NULL,
  product_ids BIGINT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  usage_count INTEGER;
  user_usage_count INTEGER;
  is_valid BOOLEAN := true;
  validation_errors TEXT[] := '{}';
  discount_amount DECIMAL := 0;
  final_amount DECIMAL := 0;
  validation_result JSON;
BEGIN
  -- Récupérer le coupon
  SELECT * INTO coupon_record 
  FROM coupons 
  WHERE code = coupon_code 
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Code promo invalide ou expiré'
    );
  END IF;

  -- Vérifier la limite d'utilisation globale
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.times_used >= coupon_record.usage_limit THEN
    is_valid := false;
    validation_errors := validation_errors || 'Ce code promo a atteint sa limite d''utilisation';
  END IF;

  -- Vérifier la limite par utilisateur
  IF user_id IS NOT NULL AND coupon_record.user_usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO user_usage_count
    FROM orders 
    WHERE user_id = validate_coupon.user_id 
      AND coupon_id = coupon_record.id
      AND status NOT IN ('cancelled', 'payment_failed');
    
    IF user_usage_count >= coupon_record.user_usage_limit THEN
      is_valid := false;
      validation_errors := validation_errors || 'Vous avez déjà utilisé ce code promo le nombre maximum de fois autorisé';
    END IF;
  END IF;

  -- Vérifier le montant minimum de commande
  IF order_amount IS NOT NULL AND coupon_record.min_order_amount IS NOT NULL THEN
    IF order_amount < coupon_record.min_order_amount THEN
      is_valid := false;
      validation_errors := validation_errors || 
        'Ce code promo nécessite un montant minimum de commande de ' || coupon_record.min_order_amount || ' XOF';
    END IF;
  END IF;

  -- Vérifier les produits éligibles
  IF product_ids IS NOT NULL AND coupon_record.applicable_product_ids IS NOT NULL THEN
    IF NOT (product_ids && coupon_record.applicable_product_ids) THEN
      is_valid := false;
      validation_errors := validation_errors || 'Ce code promo ne s''applique pas aux produits de votre panier';
    END IF;
  END IF;

  -- Vérifier les catégories éligibles
  IF product_ids IS NOT NULL AND coupon_record.applicable_category_ids IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = ANY(product_ids) 
      AND category_id = ANY(coupon_record.applicable_category_ids)
    ) THEN
      is_valid := false;
      validation_errors := validation_errors || 'Ce code promo ne s''applique pas aux catégories de votre panier';
    END IF;
  END IF;

  -- Vérifier si c'est la première commande
  IF coupon_record.first_order_only AND user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM orders 
      WHERE user_id = validate_coupon.user_id 
      AND status NOT IN ('cancelled', 'payment_failed')
    ) THEN
      is_valid := false;
      validation_errors := validation_errors || 'Ce code promo est réservé à votre première commande';
    END IF;
  END IF;

  -- Calculer la réduction si valide
  IF is_valid AND order_amount IS NOT NULL THEN
    discount_amount := calculate_discount_amount(
      order_amount, 
      coupon_record.discount_type, 
      coupon_record.discount_value,
      coupon_record.max_discount_amount
    );
    
    final_amount := order_amount - discount_amount;
    
    -- S'assurer que le montant final n'est pas négatif
    IF final_amount < 0 THEN
      final_amount := 0;
      discount_amount := order_amount;
    END IF;
  END IF;

  -- Construire le résultat
  validation_result := json_build_object(
    'valid', is_valid,
    'coupon', json_build_object(
      'id', coupon_record.id,
      'code', coupon_record.code,
      'name', coupon_record.name,
      'description', coupon_record.description,
      'discount_type', coupon_record.discount_type,
      'discount_value', coupon_record.discount_value,
      'max_discount_amount', coupon_record.max_discount_amount
    ),
    'discount_amount', discount_amount,
    'final_amount', final_amount,
    'errors', validation_errors
  );

  -- Journaliser la validation
  INSERT INTO coupon_validations (
    coupon_id,
    user_id,
    order_amount,
    is_valid,
    validation_result,
    created_at
  ) VALUES (
    coupon_record.id,
    user_id,
    order_amount,
    is_valid,
    validation_result,
    NOW()
  );

  RETURN validation_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'validate_coupon',
      SQLERRM,
      user_id,
      json_build_object('coupon_code', coupon_code),
      NOW()
    );
    
    RETURN json_build_object(
      'valid', false,
      'error', 'Erreur lors de la validation du code promo'
    );
END;
$$;

-- Fonction helper pour calculer le montant de la réduction
CREATE OR REPLACE FUNCTION calculate_discount_amount(
  order_amount DECIMAL,
  discount_type TEXT,
  discount_value DECIMAL,
  max_discount_amount DECIMAL DEFAULT NULL
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  calculated_discount DECIMAL;
BEGIN
  CASE discount_type
    WHEN 'percentage' THEN
      calculated_discount := (order_amount * discount_value / 100);
    WHEN 'fixed' THEN
      calculated_discount := discount_value;
    WHEN 'free_shipping' THEN
      calculated_discount := 0; -- Géré séparément dans les frais de livraison
    ELSE
      calculated_discount := 0;
  END CASE;

  -- Appliquer la limite maximale de réduction
  IF max_discount_amount IS NOT NULL AND calculated_discount > max_discount_amount THEN
    calculated_discount := max_discount_amount;
  END IF;

  -- Ne pas dépasser le montant de la commande
  IF calculated_discount > order_amount THEN
    calculated_discount := order_amount;
  END IF;

  RETURN calculated_discount;
END;
$$;
