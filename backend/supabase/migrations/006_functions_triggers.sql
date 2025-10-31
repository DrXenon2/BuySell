-- Création de toutes les fonctions et triggers
-- Intègre toutes les fonctions développées précédemment

BEGIN;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer les numéros de commande
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

-- Fonction pour calculer les frais de livraison
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

-- Fonction pour mettre à jour le vecteur de recherche des produits
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

-- Trigger pour le vecteur de recherche
DROP TRIGGER IF EXISTS update_product_search ON products;
CREATE TRIGGER update_product_search
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Créer les triggers updated_at pour toutes les tables
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

-- Insérer ici toutes les autres fonctions que nous avons créées...
-- (handle_new_user, handle_email_verification, handle_password_reset, etc.)

-- Pour des raisons de longueur, je vais créer un fichier séparé avec toutes les fonctions
-- et les inclure via \i dans une migration séparée

COMMIT;
