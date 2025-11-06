-- Fonction pour créer une commande
-- Gère la création complète d'une commande avec validation

CREATE OR REPLACE FUNCTION create_order(
  user_id UUID,
  shipping_address_id BIGINT,
  billing_address_id BIGINT DEFAULT NULL,
  cart_items JSONB DEFAULT NULL,
  coupon_code TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_number TEXT;
  order_record RECORD;
  cart_item RECORD;
  product_record RECORD;
  address_record RECORD;
  coupon_record RECORD;
  subtotal DECIMAL := 0;
  shipping_cost DECIMAL := 0;
  tax_amount DECIMAL := 0;
  discount_amount DECIMAL := 0;
  total_amount DECIMAL := 0;
  order_id BIGINT;
  order_details JSON;
  item_count INTEGER := 0;
BEGIN
  -- Générer un numéro de commande unique
  order_number := generate_order_number();
  
  -- Récupérer l'adresse de livraison
  SELECT * INTO address_record 
  FROM addresses 
  WHERE id = shipping_address_id AND user_id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Adresse de livraison non trouvée';
  END IF;

  -- Calculer les frais de livraison basés sur la localisation
  shipping_cost := calculate_shipping_cost(address_record.city, address_record.country);

  -- Traiter les articles du panier
  IF cart_items IS NOT NULL THEN
    FOR cart_item IN SELECT * FROM jsonb_to_recordset(cart_items) AS (
      product_id BIGINT,
      quantity INTEGER,
      variant_id BIGINT DEFAULT NULL
    )
    LOOP
      -- Récupérer les infos du produit
      SELECT * INTO product_record 
      FROM products 
      WHERE id = cart_item.product_id AND is_available = true;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Produit non disponible: %', cart_item.product_id;
      END IF;

      -- Vérifier le stock
      IF product_record.track_quantity AND product_record.quantity < cart_item.quantity THEN
        RAISE EXCEPTION 'Stock insuffisant pour: %', product_record.name;
      END IF;

      -- Calculer le sous-total
      subtotal := subtotal + (product_record.price * cart_item.quantity);
      item_count := item_count + cart_item.quantity;
    END LOOP;
  ELSE
    -- Utiliser le panier existant de l'utilisateur
    FOR cart_item IN SELECT * FROM cart_items WHERE user_id = user_id AND is_active = true
    LOOP
      SELECT * INTO product_record 
      FROM products 
      WHERE id = cart_item.product_id AND is_available = true;
      
      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      IF product_record.track_quantity AND product_record.quantity < cart_item.quantity THEN
        RAISE EXCEPTION 'Stock insuffisant pour: %', product_record.name;
      END IF;

      subtotal := subtotal + (product_record.price * cart_item.quantity);
      item_count := item_count + cart_item.quantity;
    END LOOP;
  END IF;

  -- Appliquer les taxes (exemple: 18% pour Sénégal)
  tax_amount := subtotal * 0.18;

  -- Appliquer coupon de réduction si fourni
  IF coupon_code IS NOT NULL THEN
    SELECT * INTO coupon_record 
    FROM coupons 
    WHERE code = coupon_code 
      AND is_active = true 
      AND (valid_until IS NULL OR valid_until > NOW())
      AND (usage_limit IS NULL OR times_used < usage_limit);
    
    IF FOUND THEN
      discount_amount := calculate_discount(subtotal, coupon_record.discount_type, coupon_record.discount_value);
      
      -- Incrémenter l'utilisation du coupon
      UPDATE coupons 
      SET times_used = times_used + 1 
      WHERE id = coupon_record.id;
    END IF;
  END IF;

  -- Calculer le total final
  total_amount := subtotal + shipping_cost + tax_amount - discount_amount;

  -- Créer la commande
  INSERT INTO orders (
    user_id,
    order_number,
    status,
    subtotal,
    shipping_cost,
    tax_amount,
    discount_amount,
    total_amount,
    items_count,
    shipping_address,
    billing_address,
    coupon_id,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    order_number,
    'pending',
    subtotal,
    shipping_cost,
    tax_amount,
    discount_amount,
    total_amount,
    item_count,
    (SELECT row_to_json(address_record)::JSONB),
    (SELECT row_to_json(a)::JSONB FROM addresses a WHERE id = COALESCE(billing_address_id, shipping_address_id)),
    coupon_record.id,
    jsonb_build_object(
      'shipping_method', 'standard',
      'estimated_delivery', (NOW() + INTERVAL '5 days')::TEXT,
      'ip_address', current_setting('request.headers')::JSON->>'x-forwarded-for'
    ),
    NOW(),
    NOW()
  )
  RETURNING * INTO order_record;

  order_id := order_record.id;

  -- Créer les order_items
  IF cart_items IS NOT NULL THEN
    INSERT INTO order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      product_sku,
      product_image,
      quantity,
      unit_price,
      total_price,
      specifications,
      created_at
    )
    SELECT 
      order_id,
      ci.product_id,
      ci.variant_id,
      p.name,
      p.sku,
      COALESCE(p.images->>0, '/images/products/placeholder.jpg'),
      ci.quantity,
      p.price,
      p.price * ci.quantity,
      p.specifications,
      NOW()
    FROM jsonb_to_recordset(cart_items) AS ci(
      product_id BIGINT,
      quantity INTEGER,
      variant_id BIGINT
    )
    JOIN products p ON p.id = ci.product_id;
  ELSE
    INSERT INTO order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      product_sku,
      product_image,
      quantity,
      unit_price,
      total_price,
      specifications,
      created_at
    )
    SELECT 
      order_id,
      ci.product_id,
      ci.variant_id,
      p.name,
      p.sku,
      COALESCE(p.images->>0, '/images/products/placeholder.jpg'),
      ci.quantity,
      p.price,
      p.price * ci.quantity,
      p.specifications,
      NOW()
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = user_id AND ci.is_active = true;
  END IF;

  -- Vider le panier de l'utilisateur
  UPDATE cart_items 
  SET is_active = false 
  WHERE user_id = user_id AND is_active = true;

  -- Journaliser la création
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    user_id,
    'ORDER_CREATED',
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_number,
      'item_count', item_count,
      'total_amount', total_amount
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
    user_id,
    'ORDER_CREATED',
    'Commande créée! 📦',
    'Votre commande #' || order_number || ' a été créée avec succès.',
    '/orders/' || order_id,
    'Voir la commande',
    'medium',
    NOW()
  );

  -- Retourner les détails de la commande
  SELECT row_to_json(o) INTO order_details
  FROM (
    SELECT 
      o.*,
      (SELECT jsonb_agg(row_to_json(oi)) 
       FROM order_items oi 
       WHERE oi.order_id = o.id) as items,
      a.street as shipping_street,
      a.city as shipping_city,
      a.state as shipping_state,
      a.country as shipping_country
    FROM orders o
    LEFT JOIN addresses a ON (o.shipping_address->>'id')::BIGINT = a.id
    WHERE o.id = order_id
  ) o;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', order_id,
    'order_number', order_number,
    'order', order_details
  );

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'create_order',
      SQLERRM,
      user_id,
      jsonb_build_object(
        'shipping_address_id', shipping_address_id,
        'cart_items_count', jsonb_array_length(cart_items)
      ),
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
