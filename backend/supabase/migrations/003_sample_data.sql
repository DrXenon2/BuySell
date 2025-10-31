-- Migration 003: Sample Data for Development
-- Insert sample categories, products, and test data

BEGIN;

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, is_active, sort_order, metadata) VALUES
('Électronique', 'electronique', 'Smartphones, tablettes, ordinateurs et accessoires', '/images/categories/electronics.jpg', true, 1, '{"color": "#3B82F6", "icon": "📱"}'),
('Mode & Vêtements', 'mode-vetements', 'Vêtements, chaussures et accessoires de mode', '/images/categories/fashion.jpg', true, 2, '{"color": "#EF4444", "icon": "👕"}'),
('Maison & Jardin', 'maison-jardin', 'Meubles, décoration et articles de jardin', '/images/categories/home.jpg', true, 3, '{"color": "#10B981", "icon": "🏠"}'),
('Sports & Loisirs', 'sports-loisirs', 'Équipements sportifs et articles de loisir', '/images/categories/sports.jpg', true, 4, '{"color": "#F59E0B", "icon": "⚽"}'),
('Livres & Éducation', 'livres-education', 'Livres, fournitures scolaires et éducatives', '/images/categories/books.jpg', true, 5, '{"color": "#8B5CF6", "icon": "📚"}'),
('Beauté & Santé', 'beaute-sante', 'Cosmétiques, produits de beauté et santé', '/images/categories/beauty.jpg', true, 6, '{"color": "#EC4899", "icon": "💄"}'),
('Automobile', 'automobile', 'Pièces auto, accessoires et entretien', '/images/categories/automotive.jpg', true, 7, '{"color": "#6B7280", "icon": "🚗"}')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    metadata = EXCLUDED.metadata;

-- Insert sample coupons
INSERT INTO coupons (code, name, description, discount_type, discount_value, max_discount_amount, usage_limit, user_usage_limit, min_order_amount, valid_from, valid_until, is_active, campaign_name) VALUES
('BIENVENUE10', 'Réduction de bienvenue', '10% de réduction sur votre première commande', 'percentage', 10, 5000, 1000, 1, 10000, NOW(), NOW() + INTERVAL '1 year', true, 'Campagne de bienvenue'),
('LIVRAISONGRATUITE', 'Livraison gratuite', 'Livraison gratuite sur toute commande', 'free_shipping', 0, NULL, 500, 1, 20000, NOW(), NOW() + INTERVAL '6 months', true, 'Livraison offerte'),
('SOLDES20', 'Soldes d''été', '20% de réduction pendant les soldes', 'percentage', 20, 10000, 2000, 2, 15000, NOW(), NOW() + INTERVAL '3 months', true, 'Soldes été 2024'),
('FIDELITE15', 'Code fidélité', '15% de réduction pour les clients fidèles', 'percentage', 15, 7500, NULL, 1, 12000, NOW(), NOW() + INTERVAL '2 years', true, 'Programme fidélité'),
('DECOUVERTE5', 'Découverte', '5% de réduction sur votre première commande', 'percentage', 5, 2500, 5000, 1, 5000, NOW(), NOW() + INTERVAL '1 year', true, 'Découverte plateforme')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    discount_value = EXCLUDED.discount_value,
    valid_until = EXCLUDED.valid_until,
    is_active = EXCLUDED.is_active;

-- Insert sample products (these will be linked to actual users when they register)
-- Note: user_id will be set when actual sellers create accounts

-- Insert sample admin user (if needed for testing)
-- Note: This is just a template - actual users should register through auth
INSERT INTO profiles (id, username, first_name, last_name, email_verified, is_active, created_at, updated_at) 
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'admin',
    'System',
    'Administrator',
    true,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001');

-- Insert sample user settings for admin
INSERT INTO user_settings (user_id, email_notifications, sms_notifications, push_notifications, newsletter_subscribed, theme, created_at, updated_at)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    true,
    false,
    true,
    true,
    'dark',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = '00000000-0000-0000-0000-000000000001');

-- Insert sample product specifications template
INSERT INTO products (name, slug, description, price, compare_price, quantity, images, specifications, metadata, category_id, user_id, is_available, is_published, created_at, updated_at)
SELECT 
    'Smartphone Samsung Galaxy S23',
    'samsung-galaxy-s23',
    'Smartphone Android haut de gamme avec écran 6.1", 128GB de stockage, appareil photo 50MP',
    450000,
    499000,
    15,
    ARRAY['/images/products/samsung-s23-1.jpg', '/images/products/samsung-s23-2.jpg'],
    '{"marque": "Samsung", "modele": "Galaxy S23", "ecran": "6.1 pouces", "stockage": "128GB", "ram": "8GB", "camera": "50MP + 12MP + 10MP", "batterie": "3900mAh"}',
    '{"tags": ["smartphone", "samsung", "android", "5g"], "featured": true, "rating": 4.5, "review_count": 127}',
    (SELECT id FROM categories WHERE slug = 'electronique'),
    '00000000-0000-0000-0000-000000000001',
    true,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'samsung-galaxy-s23');

-- Insert more sample products
INSERT INTO products (name, slug, description, price, compare_price, quantity, images, specifications, metadata, category_id, user_id, is_available, is_published, created_at, updated_at) VALUES
('Casque Bluetooth Sony WH-1000XM4', 'casque-sony-wh1000xm4', 'Casque audio sans fil avec réduction de bruit active, autonomie 30 heures', 125000, 149000, 25, ARRAY['/images/products/sony-headphones.jpg'], '{"marque": "Sony", "modele": "WH-1000XM4", "type": "Over-ear", "connectivite": "Bluetooth 5.0", "autonomie": "30 heures", "reduction_bruit": "Active"}', '{"tags": ["casque", "bluetooth", "sony", "audio"], "featured": false, "rating": 4.8, "review_count": 89}', (SELECT id FROM categories WHERE slug = 'electronique'), '00000000-0000-0000-0000-000000000001', true, true, NOW(), NOW()),
('Boubou Africain Homme Premium', 'boubou-africain-homme-premium', 'Boubou traditionnel africain en tissu wax de haute qualité, fabrication artisanale', 35000, 45000, 50, ARRAY['/images/products/boubou-homme.jpg'], '{"tissu": "Wax 100% coton", "couleur": "Multicolore", "taille": "Taille Unique", "origine": "Côte d''Ivoire", "entretien": "Lavage à la main"}', '{"tags": ["boubou", "africain", "wax", "traditionnel"], "featured": true, "rating": 4.7, "review_count": 203}', (SELECT id FROM categories WHERE slug = 'mode-vetements'), '00000000-0000-0000-0000-000000000001', true, true, NOW(), NOW()),
('Set de Coussins Décoratifs', 'set-coussins-decoratifs', 'Set de 4 coussins décoratifs avec motifs africains, dimensions 45x45cm', 25000, 32000, 40, ARRAY['/images/products/coussins-deco.jpg'], '{"materiau": "Coton 100%", "dimensions": "45x45cm", "lavage": "Machine à 30°C", "motifs": "Africains traditionnels", "composition": "4 coussins + 4 housses"}', '{"tags": ["coussins", "decoration", "maison", "africain"], "featured": true, "rating": 4.3, "review_count": 67}', (SELECT id FROM categories WHERE slug = 'maison-jardin'), '00000000-0000-0000-0000-000000000001', true, true, NOW(), NOW()),
('Ballon de Football Professionnel', 'ballon-football-professionnel', 'Ballon de football professionnel taille 5, conforme aux normes FIFA', 18000, 25000, 30, ARRAY['/images/products/ballon-foot.jpg'], '{"type": "Professionnel", "taille": "5", "matiere": "Polyuréthane", "pression": "8-10 PSI", "normes": "FQUALITY"}', '{"tags": ["football", "sport", "ballon", "professionnel"], "featured": false, "rating": 4.6, "review_count": 45}', (SELECT id FROM categories WHERE slug = 'sports-loisirs'), '00000000-0000-0000-0000-000000000001', true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    quantity = EXCLUDED.quantity,
    updated_at = NOW();

-- Insert sample addresses template
INSERT INTO addresses (user_id, type, street, city, state, postal_code, country, is_default, created_at, updated_at)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'shipping',
    '123 Rue de la Corniche',
    'Dakar',
    'Dakar',
    '12500',
    'SN',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = '00000000-0000-0000-0000-000000000001' AND type = 'shipping');

-- Insert sample reviews for products
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified, status, created_at, updated_at)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000001'::UUID,
    5,
    'Excellent produit!',
    'Je suis très satisfait de ce produit, il correspond parfaitement à mes attentes. Livraison rapide et emballage soigné.',
    true,
    'approved',
    NOW() - INTERVAL '10 days',
    NOW()
FROM products p
WHERE p.slug = 'samsung-galaxy-s23'
AND NOT EXISTS (SELECT 1 FROM reviews WHERE product_id = p.id AND user_id = '00000000-0000-0000-0000-000000000001');

-- Insert more sample reviews
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified, status, created_at, updated_at) VALUES
((SELECT id FROM products WHERE slug = 'casque-sony-wh1000xm4'), '00000000-0000-0000-0000-000000000001', 4, 'Très bon casque', 'Réduction de bruit impressionnante et confortable pour de longues sessions.', true, 'approved', NOW() - INTERVAL '5 days', NOW()),
((SELECT id FROM products WHERE slug = 'boubou-africain-homme-premium'), '00000000-0000-0000-0000-000000000001', 5, 'Magnifique boubou', 'Tissu de qualité et couleurs éclatantes. Très apprécié lors de la cérémonie.', true, 'approved', NOW() - INTERVAL '15 days', NOW()),
((SELECT id FROM products WHERE slug = 'set-coussins-decoratifs'), '00000000-0000-0000-0000-000000000001', 4, 'Belle décoration', 'Coussins de bonne qualité qui apportent une touche africaine à mon salon.', true, 'approved', NOW() - INTERVAL '8 days', NOW())
ON CONFLICT (product_id, user_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    updated_at = NOW();

-- Update product ratings based on inserted reviews
UPDATE products 
SET metadata = metadata || jsonb_build_object(
    'rating', (
        SELECT AVG(rating)::DECIMAL(3,2) 
        FROM reviews 
        WHERE product_id = products.id AND status = 'approved'
    ),
    'review_count', (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE product_id = products.id AND status = 'approved'
    )
)
WHERE id IN (SELECT product_id FROM reviews);

-- Insert sample notification
INSERT INTO notifications (user_id, type, title, message, action_url, action_label, priority, created_at)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'WELCOME',
    'Bienvenue sur BuySell! 🎉',
    'Merci de vous être inscrit sur notre plateforme. Découvrez nos produits et commencez à acheter ou vendre.',
    '/products',
    'Explorer',
    'medium',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = '00000000-0000-0000-0000-000000000001' AND type = 'WELCOME');

COMMIT;
