-- Fonction pour générer des numéros de commande uniques
-- Format: BS-YYYYMMDD-XXXXX (BS-20231201-12345)

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_part TEXT;
  sequence_number INTEGER;
  order_number TEXT;
  max_attempts INTEGER := 5;
  attempts INTEGER := 0;
BEGIN
  -- Partie date: AAAAMMJJ
  date_part := to_char(NOW(), 'YYYYMMDD');
  
  WHILE attempts < max_attempts LOOP
    -- Générer un numéro séquentiel aléatoire entre 10000 et 99999
    sequence_number := floor(random() * 90000 + 10000)::INTEGER;
    order_number := 'BS-' || date_part || '-' || sequence_number::TEXT;
    
    -- Vérifier l'unicité
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = generate_order_number.order_number) THEN
      RETURN order_number;
    END IF;
    
    attempts := attempts + 1;
  END LOOP;
  
  -- Si on arrive ici, essayer avec un timestamp pour garantir l'unicité
  order_number := 'BS-' || date_part || '-' || to_char(EXTRACT(EPOCH FROM NOW()), 'FM00000');
  RETURN order_number;
END;
$$;
