-- Fonction pour calculer les frais de livraison
-- Basé sur la localisation, le poids et le type de livraison

CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  city TEXT DEFAULT 'Dakar',
  country TEXT DEFAULT 'SN',
  total_weight DECIMAL DEFAULT 0,
  delivery_type TEXT DEFAULT 'standard',
  order_amount DECIMAL DEFAULT 0
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_cost DECIMAL := 0;
  weight_cost DECIMAL := 0;
  location_multiplier DECIMAL := 1.0;
  free_shipping_threshold DECIMAL := 50000; -- 50,000 XOF
  final_cost DECIMAL;
BEGIN
  -- Frais de base par type de livraison
  base_cost := CASE delivery_type
    WHEN 'standard' THEN 2000
    WHEN 'express' THEN 5000
    WHEN 'priority' THEN 8000
    ELSE 2000
  END;

  -- Frais supplémentaires par poids (au-delà de 1kg)
  IF total_weight > 1 THEN
    weight_cost := (CEIL(total_weight - 1) * 500); -- 500 XOF par kg supplémentaire
  END IF;

  -- Multiplicateur basé sur la localisation
  location_multiplier := CASE 
    WHEN city IN ('Dakar', 'Pikine', 'Guediawaye', 'Rufisque') THEN 1.0
    WHEN city IN ('Thies', 'Mbour', 'Saint-Louis') THEN 1.3
    WHEN city IN ('Kaolack', 'Ziguinchor', 'Diourbel') THEN 1.5
    ELSE 2.0 -- Zones éloignées
  END;

  -- Calcul du coût final
  final_cost := (base_cost + weight_cost) * location_multiplier;

  -- Livraison gratuite si le montant de commande dépasse le seuil
  IF order_amount >= free_shipping_threshold AND delivery_type = 'standard' THEN
    final_cost := 0;
  END IF;

  -- Arrondir à 100 XOF près
  final_cost := CEIL(final_cost / 100) * 100;

  RETURN GREATEST(final_cost, 0); -- Ne pas retourner de valeur négative
END;
$$;
