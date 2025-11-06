-- Migration 007: Additional Security Policies and Functions
-- Enhanced security measures and utility functions

BEGIN;

-- Function to validate coupon codes
CREATE OR REPLACE FUNCTION validate_coupon(
    coupon_code TEXT,
    user_id UUID DEFAULT NULL,
    order_amount DECIMAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    coupon_record RECORD;
    user_usage_count INTEGER;
    is_valid BOOLEAN := true;
    validation_errors TEXT[] := '{}';
    discount_amount DECIMAL := 0;
    final_amount DECIMAL := 0;
    validation_result JSON;
BEGIN
    -- Get coupon
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

    -- Check usage limit
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.times_used >= coupon_record.usage_limit THEN
        is_valid := false;
        validation_errors := validation_errors || 'Ce code promo a atteint sa limite d''utilisation';
    END IF;

    -- Check user usage limit
    IF user_id IS NOT NULL AND coupon_record.user_usage_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO user_usage_count
        FROM orders 
        WHERE user_id = validate_coupon.user_id 
            AND coupon_id = coupon_record.id
            AND status NOT IN ('cancelled', 'payment_failed');
        
        IF user_usage_count >= coupon_record.user_usage_limit THEN
            is_valid := false;
            validation_errors := validation_errors || 'Vous avez déjà utilisé ce code promo le nombre maximum de fois';
        END IF;
    END IF;

    -- Check minimum order amount
    IF order_amount IS NOT NULL AND coupon_record.min_order_amount IS NOT NULL THEN
        IF order_amount < coupon_record.min_order_amount THEN
            is_valid := false;
            validation_errors := validation_errors || 
                'Montant minimum requis: ' || coupon_record.min_order_amount || ' XOF';
        END IF;
    END IF;

    -- Calculate discount if valid
    IF is_valid AND order_amount IS NOT NULL THEN
        discount_amount := calculate_discount_amount(
            order_amount, 
            coupon_record.discount_type, 
            coupon_record.discount_value,
            coupon_record.max_discount_amount
        );
        
        final_amount := order_amount - discount_amount;
        
        IF final_amount < 0 THEN
            final_amount := 0;
            discount_amount := order_amount;
        END IF;
    END IF;

    validation_result := json_build_object(
        'valid', is_valid,
        'coupon', json_build_object(
            'id', coupon_record.id,
            'code', coupon_record.code,
            'name', coupon_record.name,
            'discount_type', coupon_record.discount_type,
            'discount_value', coupon_record.discount_value,
            'max_discount_amount', coupon_record.max_discount_amount
        ),
        'discount_amount', discount_amount,
        'final_amount', final_amount,
        'errors', validation_errors
    );

    -- Log validation
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
        RETURN json_build_object(
            'valid', false,
            'error', 'Erreur lors de la validation du code promo'
        );
END;
$$;

-- Helper function to calculate discount amount
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
            calculated_discount := 0;
        ELSE
            calculated_discount := 0;
    END CASE;

    IF max_discount_amount IS NOT NULL AND calculated_discount > max_discount_amount THEN
        calculated_discount := max_discount_amount;
    END IF;

    IF calculated_discount > order_amount THEN
        calculated_discount := order_amount;
    END IF;

    RETURN calculated_discount;
END;
$$;

-- Function for data cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_notifications INTEGER := 0;
    deleted_audit_logs INTEGER := 0;
    deleted_error_logs INTEGER := 0;
    cleanup_result JSON;
BEGIN
    -- Delete old notifications (older than 90 days)
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND (read_at IS NOT NULL OR priority != 'high');
    
    GET DIAGNOSTICS deleted_notifications = ROW_COUNT;

    -- Delete old audit logs (older than 1 year)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_audit_logs = ROW_COUNT;

    -- Delete old error logs (older than 30 days)
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_error_logs = ROW_COUNT;

    -- Cleanup abandoned carts (older than 30 days)
    DELETE FROM cart_items 
    WHERE updated_at < NOW() - INTERVAL '30 days' 
    AND is_active = true;

    -- Log cleanup
    INSERT INTO audit_logs (
        action,
        resource_type,
        details,
        created_at
    ) VALUES (
        'DATA_CLEANUP_COMPLETED',
        'system',
        json_build_object(
            'deleted_notifications', deleted_notifications,
            'deleted_audit_logs', deleted_audit_logs,
            'deleted_error_logs', deleted_error_logs
        ),
        NOW()
    );

    cleanup_result := json_build_object(
        'success', true,
        'deleted_notifications', deleted_notifications,
        'deleted_audit_logs', deleted_audit_logs,
        'deleted_error_logs', deleted_error_logs,
        'message', 'Nettoyage des données terminé'
    );

    RETURN cleanup_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Additional security policies

-- Policy for order creation
CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for cart management
CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Policy for reviews
CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for addresses
CREATE POLICY "Users can manage own addresses" ON addresses
    FOR ALL USING (auth.uid() = user_id);

-- Policy for payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for seller access to orders containing their products
CREATE POLICY "Sellers can view orders with their products" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = orders.id AND p.user_id = auth.uid()
        )
    );

COMMIT;
