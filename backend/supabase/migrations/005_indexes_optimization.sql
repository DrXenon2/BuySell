-- Indexes pour optimiser les performances
-- Recherche, tris et jointures rapides

BEGIN;

-- Indexes pour les profiles
CREATE INDEX CONCURRENTLY idx_profiles_user_id ON profiles(id);
CREATE INDEX CONCURRENTLY idx_profiles_username ON profiles(username);
CREATE INDEX CONCURRENTLY idx_profiles_email_verified ON profiles(email_verified) WHERE email_verified = true;
CREATE INDEX CONCURRENTLY idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;

-- Indexes pour les seller_profiles
CREATE INDEX CONCURRENTLY idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX CONCURRENTLY idx_seller_profiles_store_slug ON seller_profiles(store_slug);
CREATE INDEX CONCURRENTLY idx_seller_profiles_is_active ON seller_profiles(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_seller_profiles_is_verified ON seller_profiles(is_verified) WHERE is_verified = true;

-- Indexes pour les categories
CREATE INDEX CONCURRENTLY idx_categories_slug ON categories(slug);
CREATE INDEX CONCURRENTLY idx_categories_parent_id ON categories(parent_id);
CREATE INDEX CONCURRENTLY idx_categories_is_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_categories_sort_order ON categories(sort_order);

-- Indexes pour les products (optimisation recherche et performance)
CREATE INDEX CONCURRENTLY idx_products_user_id ON products(user_id);
CREATE INDEX CONCURRENTLY idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY idx_products_slug ON products(slug);
CREATE INDEX CONCURRENTLY idx_products_sku ON products(sku);
CREATE INDEX CONCURRENTLY idx_products_price ON products(price);
CREATE INDEX CONCURRENTLY idx_products_is_available ON products(is_available) WHERE is_available = true;
CREATE INDEX CONCURRENTLY idx_products_is_published ON products(is_published) WHERE is_published = true;
CREATE INDEX CONCURRENTLY idx_products_created_at ON products(created_at DESC);
CREATE INDEX CONCURRENTLY idx_products_quantity ON products(quantity) WHERE track_quantity = true;

-- Index de recherche full-text pour les produits
CREATE INDEX CONCURRENTLY idx_products_search_vector ON products USING GIN(search_vector);

-- Indexes pour les orders
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_orders_order_number ON orders(order_number);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_paid_at ON orders(paid_at) WHERE paid_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_orders_total_amount ON orders(total_amount);

-- Indexes pour les order_items
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
CREATE INDEX CONCURRENTLY idx_order_items_product_id ON order_items(product_id);
CREATE INDEX CONCURRENTLY idx_order_items_variant_id ON order_items(variant_id) WHERE variant_id IS NOT NULL;

-- Indexes pour les payments
CREATE INDEX CONCURRENTLY idx_payments_order_id ON payments(order_id);
CREATE INDEX CONCURRENTLY idx_payments_user_id ON payments(user_id);
CREATE INDEX CONCURRENTLY idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX CONCURRENTLY idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY idx_payments_created_at ON payments(created_at DESC);

-- Indexes pour les transactions
CREATE INDEX CONCURRENTLY idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX CONCURRENTLY idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY idx_transactions_gateway ON transactions(gateway);
CREATE INDEX CONCURRENTLY idx_transactions_created_at ON transactions(created_at DESC);

-- Indexes pour les reviews
CREATE INDEX CONCURRENTLY idx_reviews_product_id ON reviews(product_id);
CREATE INDEX CONCURRENTLY idx_reviews_user_id ON reviews(user_id);
CREATE INDEX CONCURRENTLY idx_reviews_rating ON reviews(rating);
CREATE INDEX CONCURRENTLY idx_reviews_status ON reviews(status);
CREATE INDEX CONCURRENTLY idx_reviews_created_at ON reviews(created_at DESC);

-- Indexes pour les cart_items
CREATE INDEX CONCURRENTLY idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX CONCURRENTLY idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX CONCURRENTLY idx_cart_items_is_active ON cart_items(is_active) WHERE is_active = true;

-- Indexes pour les coupons
CREATE INDEX CONCURRENTLY idx_coupons_code ON coupons(code);
CREATE INDEX CONCURRENTLY idx_coupons_is_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_coupons_valid_until ON coupons(valid_until) WHERE valid_until IS NOT NULL;

-- Indexes pour les notifications
CREATE INDEX CONCURRENTLY idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX CONCURRENTLY idx_notifications_created_at ON notifications(created_at DESC);

-- Indexes pour l'audit et les logs
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX CONCURRENTLY idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX CONCURRENTLY idx_error_logs_function_name ON error_logs(function_name);

CREATE INDEX CONCURRENTLY idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX CONCURRENTLY idx_webhook_logs_processed ON webhook_logs(processed) WHERE processed = false;

-- Indexes pour les analytics
CREATE INDEX CONCURRENTLY idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX CONCURRENTLY idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX CONCURRENTLY idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Indexes pour les validations de coupons
CREATE INDEX CONCURRENTLY idx_coupon_validations_coupon_id ON coupon_validations(coupon_id);
CREATE INDEX CONCURRENTLY idx_coupon_validations_user_id ON coupon_validations(user_id);
CREATE INDEX CONCURRENTLY idx_coupon_validations_created_at ON coupon_validations(created_at DESC);

-- Indexes pour la file d'attente email
CREATE INDEX CONCURRENTLY idx_email_queue_status ON email_queue(status) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY idx_email_queue_priority ON email_queue(priority);
CREATE INDEX CONCURRENTLY idx_email_queue_created_at ON email_queue(created_at DESC);

-- Index partiel pour les commandes récentes (optimisation des dashboards)
CREATE INDEX CONCURRENTLY idx_orders_recent_completed 
ON orders(created_at DESC) 
WHERE status IN ('delivered', 'completed');

-- Index partiel pour les produits populaires
CREATE INDEX CONCURRENTLY idx_products_popular 
ON products((metadata->>'view_count')::INT DESC) 
WHERE is_published = true AND is_available = true;

-- Index pour les recherches géographiques (adresses)
CREATE INDEX CONCURRENTLY idx_addresses_location 
ON addresses USING GIST (point(
  (metadata->>'lng')::FLOAT, 
  (metadata->>'lat')::FLOAT
)) WHERE metadata ? 'lat' AND metadata ? 'lng';

COMMIT;
