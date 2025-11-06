-- Fonction utilitaire pour mettre à jour automatiquement les timestamps updated_at
-- À attacher comme trigger sur toutes les tables qui ont un champ updated_at

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Créer les triggers pour toutes les tables principales
DO $$ 
DECLARE 
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'profiles', 'products', 'categories', 'orders', 'order_items', 
      'payments', 'reviews', 'addresses', 'cart_items', 'notifications',
      'coupons', 'seller_profiles', 'user_settings'
    )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %I;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;
