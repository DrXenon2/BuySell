-- Migration 004: Row Level Security Policies
-- Comprehensive security policies for all tables

BEGIN;

-- Enable RLS on all tables (if not already enabled in previous migrations)
DO $$ 
DECLARE 
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'user_settings', 'seller_profiles', 'categories', 'products', 
            'addresses', 'orders', 'order_items', 'payments', 'transactions',
            'reviews', 'cart_items', 'coupons', 'notifications', 'notification_recipients',
            'audit_logs', 'error_logs', 'webhook_logs', 'coupon_validations', 
            'analytics_events', 'database_backups', 'email_queue', 'audit_logs_archive'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_name);
    END LOOP;
END $$;

-- PROFILES Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles
    FOR SELECT USING (is_active = true AND privacy_level = 'public');

-- USER SETTINGS Policies
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- SELLER PROFILES Policies
DROP POLICY IF EXISTS "Sellers can view own profile" ON seller_profiles;
CREATE POLICY "Sellers can view own profile" ON seller_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can update own profile" ON seller_profiles;
CREATE POLICY "Sellers can update own profile" ON seller_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Active seller profiles are public" ON seller_profiles;
CREATE POLICY "Active seller profiles are public" ON seller_profiles
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage seller profiles" ON seller_profiles;
CREATE POLICY "Admins can manage seller profiles" ON seller_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- CATEGORIES Policies
DROP POLICY IF EXISTS "Categories are publicly viewable" ON categories;
CREATE POLICY "Categories are publicly viewable" ON categories
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;
CREATE POLICY "Only admins can modify categories" ON categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- PRODUCTS Policies
DROP POLICY IF EXISTS "Published products are publicly viewable" ON products;
CREATE POLICY "Published products are publicly viewable" ON products
    FOR SELECT USING (is_published = true AND is_available = true);

DROP POLICY IF EXISTS "Sellers can view own products" ON products;
CREATE POLICY "Sellers can view own products" ON products
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can manage own products" ON products;
CREATE POLICY "Sellers can manage own products" ON products
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to products" ON products;
CREATE POLICY "Admins have full access to products" ON products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ADDRESSES Policies
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses" ON addresses
    FOR ALL USING (auth.uid() = user_id);

-- ORDERS Policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can view orders with their products" ON orders;
CREATE POLICY "Sellers can view orders with their products" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = orders.id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ORDER ITEMS Policies
DROP POLICY IF EXISTS "Order items are viewable by order owners" ON order_items;
CREATE POLICY "Order items are viewable by order owners" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Sellers can view their order items" ON order_items;
CREATE POLICY "Sellers can view their order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = order_items.product_id AND user_id = auth.uid()
        )
    );

-- PAYMENTS Policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- TRANSACTIONS Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- REVIEWS Policies
DROP POLICY IF EXISTS "Approved reviews are publicly viewable" ON reviews;
CREATE POLICY "Approved reviews are publicly viewable" ON reviews
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
CREATE POLICY "Users can view own reviews" ON reviews
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can view reviews for their products" ON reviews;
CREATE POLICY "Sellers can view reviews for their products" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = reviews.product_id AND user_id = auth.uid()
        )
    );

-- CART ITEMS Policies
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

-- COUPONS Policies
DROP POLICY IF EXISTS "Active coupons are publicly viewable" ON coupons;
CREATE POLICY "Active coupons are publicly viewable" ON coupons
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage coupons" ON coupons;
CREATE POLICY "Only admins can manage coupons" ON coupons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- NOTIFICATIONS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATION RECIPIENTS Policies
DROP POLICY IF EXISTS "Users can view own notification recipients" ON notification_recipients;
CREATE POLICY "Users can view own notification recipients" ON notification_recipients
    FOR SELECT USING (auth.uid() = user_id);

-- AUDIT LOGS Policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ERROR LOGS Policies
DROP POLICY IF EXISTS "Only admins can view error logs" ON error_logs;
CREATE POLICY "Only admins can view error logs" ON error_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- WEBHOOK LOGS Policies
DROP POLICY IF EXISTS "Only admins can view webhook logs" ON webhook_logs;
CREATE POLICY "Only admins can view webhook logs" ON webhook_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- COUPON VALIDATIONS Policies
DROP POLICY IF EXISTS "Users can view own coupon validations" ON coupon_validations;
CREATE POLICY "Users can view own coupon validations" ON coupon_validations
    FOR SELECT USING (auth.uid() = user_id);

-- ANALYTICS EVENTS Policies
DROP POLICY IF EXISTS "Users can view own analytics events" ON analytics_events;
CREATE POLICY "Users can view own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
CREATE POLICY "Admins can view all analytics events" ON analytics_events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- DATABASE BACKUPS Policies
DROP POLICY IF EXISTS "Only admins can access backups" ON database_backups;
CREATE POLICY "Only admins can access backups" ON database_backups
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- EMAIL QUEUE Policies
DROP POLICY IF EXISTS "Only admins can access email queue" ON email_queue;
CREATE POLICY "Only admins can access email queue" ON email_queue
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- AUDIT LOGS ARCHIVE Policies
DROP POLICY IF EXISTS "Only admins can access audit archive" ON audit_logs_archive;
CREATE POLICY "Only admins can access audit archive" ON audit_logs_archive
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Insert policy for public product search (if using search function)
DROP POLICY IF EXISTS "Public can search products" ON products;
CREATE POLICY "Public can search products" ON products
    FOR SELECT TO PUBLIC USING (is_published = true AND is_available = true);

-- Insert policy for public category viewing
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories
    FOR SELECT TO PUBLIC USING (is_active = true);

-- Insert policy for public coupon viewing
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
CREATE POLICY "Public can view active coupons" ON coupons
    FOR SELECT TO PUBLIC USING (is_active = true);

COMMIT;
