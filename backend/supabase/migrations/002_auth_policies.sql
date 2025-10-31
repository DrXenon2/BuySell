-- Politiques RLS (Row Level Security) et permissions
-- Sécurité au niveau des lignes pour protéger les données

BEGIN;

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs_archive ENABLE ROW LEVEL SECURITY;

-- PROFILES
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Les profils publics peuvent être vus par tous (champs limités)
CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (
    is_active = true AND 
    privacy_level = 'public'
  );

-- USER SETTINGS
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- SELLER PROFILES
CREATE POLICY "Sellers can view own profile" ON seller_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can update own profile" ON seller_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Les profils de vendeurs actifs sont publics
CREATE POLICY "Active seller profiles are public" ON seller_profiles
  FOR SELECT USING (is_active = true);

-- CATEGORIES
-- Toutes les catégories actives sont publiques
CREATE POLICY "Categories are publicly viewable" ON categories
  FOR SELECT USING (is_active = true);

-- Seuls les admins peuvent modifier les catégories
CREATE POLICY "Only admins can modify categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- PRODUCTS
-- Les produits publiés et disponibles sont publics
CREATE POLICY "Published products are publicly viewable" ON products
  FOR SELECT USING (is_published = true AND is_available = true);

-- Les vendeurs peuvent voir leurs propres produits
CREATE POLICY "Sellers can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

-- Les vendeurs peuvent gérer leurs propres produits
CREATE POLICY "Sellers can manage own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- Les admins peuvent tout faire sur les produits
CREATE POLICY "Admins have full access to products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ADDRESSES
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- ORDERS
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les vendeurs peuvent voir les commandes de leurs produits
CREATE POLICY "Sellers can view orders with their products" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.user_id = auth.uid()
    )
  );

-- ORDER ITEMS
CREATE POLICY "Order items are viewable by order owners" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Sellers can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE id = order_items.product_id AND user_id = auth.uid()
    )
  );

-- PAYMENTS
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- TRANSACTIONS
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- REVIEWS
-- Les avis approuvés sont publics
CREATE POLICY "Approved reviews are publicly viewable" ON reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own reviews" ON reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- CART ITEMS
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- COUPONS
-- Les coupons actifs sont publics
CREATE POLICY "Active coupons are publicly viewable" ON coupons
  FOR SELECT USING (is_active = true);

-- Seuls les admins peuvent modifier les coupons
CREATE POLICY "Only admins can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATION RECIPIENTS
CREATE POLICY "Users can view own notification recipients" ON notification_recipients
  FOR SELECT USING (auth.uid() = user_id);

-- AUDIT LOGS
-- Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Les admins peuvent voir tous les logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ERROR LOGS
-- Seuls les admins peuvent voir les logs d'erreur
CREATE POLICY "Only admins can view error logs" ON error_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- WEBHOOK LOGS
CREATE POLICY "Only admins can view webhook logs" ON webhook_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- COUPON VALIDATIONS
CREATE POLICY "Users can view own coupon validations" ON coupon_validations
  FOR SELECT USING (auth.uid() = user_id);

-- ANALYTICS EVENTS
CREATE POLICY "Users can view own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- DATABASE BACKUPS
CREATE POLICY "Only admins can access backups" ON database_backups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- EMAIL QUEUE
CREATE POLICY "Only admins can access email queue" ON email_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- AUDIT LOGS ARCHIVE
CREATE POLICY "Only admins can access audit archive" ON audit_logs_archive
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMIT;
