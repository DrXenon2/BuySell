-- Fonction pour mettre à jour la note d'un produit
-- Déclenché automatiquement lors de l'ajout d'un avis

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
  -- Calculer la nouvelle note moyenne et le nombre d'avis
  SELECT 
    AVG(rating)::DECIMAL(3,2),
    COUNT(*)
  INTO 
    product_rating,
    review_count
  FROM reviews 
  WHERE product_id = NEW.product_id 
    AND status = 'approved';

  -- Mettre à jour le produit
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
    INSERT INTO error_logs (
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

-- Trigger pour mettre à jour la note après chaque nouvel avis
DROP TRIGGER IF EXISTS on_review_added ON reviews;

CREATE TRIGGER on_review_added
  AFTER INSERT OR UPDATE OF rating ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();
