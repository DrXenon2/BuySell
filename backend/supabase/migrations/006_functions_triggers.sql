-- Migration 006: Functions and Triggers
-- Add all business logic functions and triggers

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    sequence_number INTEGER;
    order_number TEXT;
    max_attempts INTEGER := 5;
    attempts INTEGER := 0;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    
    WHILE attempts < max_attempts LOOP
        sequence_number := floor(random() * 90000 + 10000)::INTEGER;
        order_number := 'BS-' || date_part || '-' || sequence_number::TEXT;
        
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = generate_order_number.order_number) THEN
            RETURN order_number;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    order_number := 'BS-' || date_part || '-' || to_char(EXTRACT(EPOCH FROM NOW()), 'FM00000');
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate shipping costs
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
    city TEXT DEFAULT 'Dakar',
    country TEXT DEFAULT 'SN',
    total_weight DECIMAL DEFAULT 0,
    delivery_type TEXT DEFAULT 'standard',
    order_amount DECIMAL DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
    base_cost DECIMAL := 0;
    weight_cost DECIMAL := 0;
    location_multiplier DECIMAL := 1.0;
    free_shipping_threshold DECIMAL := 50000;
    final_cost DECIMAL;
BEGIN
    base_cost := CASE delivery_type
        WHEN 'standard' THEN 2000
        WHEN 'express' THEN 5000
        WHEN 'priority' THEN 8000
        ELSE 2000
    END;

    IF total_weight > 1 THEN
        weight_cost := (CEIL(total_weight - 1) * 500);
    END IF;

    location_multiplier := CASE 
        WHEN city IN ('Dakar', 'Pikine', 'Guediawaye', 'Rufisque') THEN 1.0
        WHEN city IN ('Thies', 'Mbour', 'Saint-Louis') THEN 1.3
        WHEN city IN ('Kaolack', 'Ziguinchor', 'Diourbel') THEN 1.5
        ELSE 2.0
    END;

    final_cost := (base_cost + weight_cost) * location_multiplier;

    IF order_amount >= free_shipping_threshold AND delivery_type = 'standard' THEN
        final_cost := 0;
    END IF;

    final_cost := CEIL(final_cost / 100) * 100;
    RETURN GREATEST(final_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update product search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('french', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('french', COALESCE(NEW.sku, '')), 'C') ||
        setweight(to_tsvector('french', COALESCE((NEW.specifications->>'brand')::TEXT, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    username_text TEXT;
    profile_avatar TEXT;
BEGIN
    -- Generate username from email if not provided
    username_text := COALESCE(
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(REPLACE(CAST(gen_random_uuid() AS TEXT), '-', ''), 1, 8)
    );
    
    -- Default avatar based on gender or neutral
    profile_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN NEW.raw_user_meta_data->>'gender' = 'female' THEN '/images/avatars/female-default.png'
            WHEN NEW.raw_user_meta_data->>'gender' = 'male' THEN '/images/avatars/male-default.png'
            ELSE '/images/avatars/default.png'
        END
    );

    -- Insert user profile
    INSERT INTO public.profiles (
        id,
        username,
        first_name,
        last_name,
        phone,
        avatar_url,
        date_of_birth,
        gender,
        bio,
        company_name,
        website,
        location,
        language,
        currency,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        username_text,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone',
        profile_avatar,
        (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'bio',
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'website',
        NEW.raw_user_meta_data->>'location',
        COALESCE(NEW.raw_user_meta_data->>'language', 'fr'),
        COALESCE(NEW.raw_user_meta_data->>'currency', 'XOF'),
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    );

    -- Create default user settings
    INSERT INTO public.user_settings (
        user_id,
        email_notifications,
        sms_notifications,
        push_notifications,
        newsletter_subscribed,
        two_factor_enabled,
        privacy_level,
        theme,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        true,
        false,
        true,
        true,
        false,
        'public',
        'light',
        NOW(),
        NOW()
    );

    -- Create seller profile if user is a seller
    IF NEW.raw_user_meta_data->>'role' = 'seller' THEN
        INSERT INTO public.seller_profiles (
            user_id,
            store_name,
            store_slug,
            store_description,
            store_logo,
            store_banner,
            store_address,
            store_phone,
            store_email,
            business_type,
            tax_number,
            bank_account,
            payment_methods,
            delivery_options,
            rating,
            total_sales,
            is_verified,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'store_name', 'Ma Boutique'),
            LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'store_name', 'ma-boutique'), ' ', '-')),
            NEW.raw_user_meta_data->>'store_description',
            NEW.raw_user_meta_data->>'store_logo',
            NEW.raw_user_meta_data->>'store_banner',
            NEW.raw_user_meta_data->>'store_address',
            NEW.raw_user_meta_data->>'store_phone',
            NEW.raw_user_meta_data->>'store_email',
            NEW.raw_user_meta_data->>'business_type',
            NEW.raw_user_meta_data->>'tax_number',
            NEW.raw_user_meta_data->>'bank_account',
            ARRAY['bank_transfer', 'mobile_money']::TEXT[],
            ARRAY['home_delivery', 'store_pickup']::TEXT[],
            0.0,
            0,
            false,
            true,
            NOW(),
            NOW()
        );
    END IF;

    -- Log account creation
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        NEW.id,
        'USER_REGISTERED',
        'user',
        NEW.id,
        json_build_object(
            'email', NEW.email,
            'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
            'role', COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
        ),
        NEW.raw_user_meta_data->>'registration_ip',
        NEW.raw_user_meta_data->>'user_agent',
        NOW()
    );

    -- Send welcome notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        action_label,
        priority,
        created_at
    ) VALUES (
        NEW.id,
        'WELCOME',
        'Bienvenue sur BuySell Platform! 🎉',
        'Votre compte a été créé avec succès. Commencez à explorer notre marketplace.',
        '/dashboard',
        'Explorer',
        'low',
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO public.error_logs (
            function_name,
            error_message,
            user_id,
            details,
            created_at
        ) VALUES (
            'handle_new_user',
            SQLERRM,
            NEW.id,
            json_build_object(
                'email', NEW.email,
                'metadata', NEW.raw_user_meta_data
            ),
            NOW()
        );
        RAISE EXCEPTION 'Erreur lors de la création du profil: %', SQLERRM;
END;
$$;

-- Function to handle email verification
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if email was just verified
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        -- Update user profile
        UPDATE public.profiles 
        SET 
            email_verified = true,
            updated_at = NOW()
        WHERE id = NEW.id;

        -- Log email verification
        INSERT INTO public.audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            details,
            created_at
        ) VALUES (
            NEW.id,
            'EMAIL_VERIFIED',
            'user',
            NEW.id,
            json_build_object(
                'email', NEW.email,
                'verified_at', NEW.email_confirmed_at
            ),
            NOW()
        );

        -- Send confirmation notification
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            action_label,
            priority,
            created_at
        ) VALUES (
            NEW.id,
            'EMAIL_VERIFIED',
            'Email vérifié avec succès! ✅',
            'Votre adresse email a été vérifiée. Vous pouvez maintenant utiliser toutes les fonctionnalités.',
            '/dashboard',
            'Accéder au tableau de bord',
            'medium',
            NOW()
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.error_logs (
            function_name,
            error_message,
            user_id,
            details,
            created_at
        ) VALUES (
            'handle_email_verification',
            SQLERRM,
            NEW.id,
            json_build_object(
                'email', NEW.email,
                'email_confirmed_at', NEW.email_confirmed_at
            ),
            NOW()
        );
        RETURN NEW;
END;
$$;

-- Function to update product ratings
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    product_rating DECIMAL;
    review_count INTEGER;
BEGIN
    -- Calculate new average rating and review count
    SELECT 
        AVG(rating)::DECIMAL(3,2),
        COUNT(*)
    INTO 
        product_rating,
        review_count
    FROM reviews 
    WHERE product_id = NEW.product_id 
        AND status = 'approved';

    -- Update product
    UPDATE products 
    SET 
        metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
            'rating', product_rating,
            'review_count', review_count
        ),
        updated_at = NOW()
    WHERE id = NEW.product_id;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.error_logs (
            function_name,
            error_message,
            details,
            created_at
        ) VALUES (
            'update_product_rating',
            SQLERRM,
            json_build_object('product_id', NEW.product_id),
            NOW()
        );
        RETURN NEW;
END;
$$;

-- Function to handle low stock alerts
CREATE OR REPLACE FUNCTION handle_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    low_stock_threshold INTEGER := 10;
    critical_stock_threshold INTEGER := 3;
BEGIN
    -- Check if stock became low
    IF NEW.track_quantity = true AND NEW.quantity IS NOT NULL AND OLD.quantity IS NOT NULL THEN
        -- Low stock alert
        IF NEW.quantity <= low_stock_threshold AND OLD.quantity > low_stock_threshold THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                action_url,
                action_label,
                priority,
                created_at
            ) VALUES (
                NEW.user_id,
                'LOW_STOCK_ALERT',
                'Stock faible ⚠️',
                'Le produit "' || NEW.name || '" a un stock faible (' || NEW.quantity || ' unités restantes).',
                '/seller/products/' || NEW.id || '/edit',
                'Gérer le stock',
                'medium',
                NOW()
            );
        END IF;

        -- Critical stock alert
        IF NEW.quantity <= critical_stock_threshold AND OLD.quantity > critical_stock_threshold THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                action_url,
                action_label,
                priority,
                created_at
            ) VALUES (
                NEW.user_id,
                'CRITICAL_STOCK_ALERT',
                'Stock critique! 🚨',
                'Le produit "' || NEW.name || '" a un stock critique (' || NEW.quantity || ' unités restantes).',
                '/seller/products/' || NEW.id || '/edit',
                'Réapprovisionner',
                'high',
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.error_logs (
            function_name,
            error_message,
            user_id,
            details,
            created_at
        ) VALUES (
            'handle_low_stock',
            SQLERRM,
            NEW.user_id,
            json_build_object('product_id', NEW.id),
            NOW()
        );
        RETURN NEW;
END;
$$;

-- Create triggers

-- Trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Trigger for email verification
DROP TRIGGER IF EXISTS on_email_verification ON auth.users;
CREATE TRIGGER on_email_verification
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_email_verification();

-- Trigger for product search vector
DROP TRIGGER IF EXISTS update_product_search ON products;
CREATE TRIGGER update_product_search
    BEFORE INSERT OR UPDATE OF name, description, sku, specifications ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_search_vector();

-- Trigger for product rating updates
DROP TRIGGER IF EXISTS on_review_added ON reviews;
CREATE TRIGGER on_review_added
    AFTER INSERT OR UPDATE OF rating ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Trigger for low stock alerts
DROP TRIGGER IF EXISTS on_stock_change ON products;
CREATE TRIGGER on_stock_change
    AFTER UPDATE OF quantity ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_low_stock();

-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_seller_profiles_updated_at
    BEFORE UPDATE ON seller_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
