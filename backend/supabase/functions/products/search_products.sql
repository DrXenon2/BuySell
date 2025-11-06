-- Fonction de recherche avancée de produits
-- Supporte la recherche full-text, filtres et pagination

CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT DEFAULT NULL,
  category_ids BIGINT[] DEFAULT NULL,
  price_min DECIMAL DEFAULT NULL,
  price_max DECIMAL DEFAULT NULL,
  brands TEXT[] DEFAULT NULL,
  ratings_min DECIMAL DEFAULT NULL,
  in_stock_only BOOLEAN DEFAULT false,
  sort_by TEXT DEFAULT 'relevance',
  sort_order TEXT DEFAULT 'DESC',
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
  products_result JSON;
  search_condition TEXT;
  sort_clause TEXT;
  offset_val INTEGER;
BEGIN
  -- Calculer l'offset pour la pagination
  offset_val := (page_number - 1) * page_size;

  -- Construire la condition de recherche
  search_condition := 'WHERE p.is_available = true AND p.is_published = true';
  
  -- Recherche full-text
  IF search_query IS NOT NULL AND length(trim(search_query)) > 0 THEN
    search_condition := search_condition || 
      ' AND (p.search_vector @@ plainto_tsquery(''french'', ' || quote_literal(search_query) || 
      ') OR p.name ILIKE ' || quote_literal('%' || search_query || '%') ||
      ' OR p.description ILIKE ' || quote_literal('%' || search_query || '%') || ')';
  END IF;

  -- Filtres par catégorie
  IF category_ids IS NOT NULL AND array_length(category_ids, 1) > 0 THEN
    search_condition := search_condition || 
      ' AND p.category_id = ANY(' || quote_literal(category_ids) || ')';
  END IF;

  -- Filtres par prix
  IF price_min IS NOT NULL THEN
    search_condition := search_condition || ' AND p.price >= ' || price_min;
  END IF;
  
  IF price_max IS NOT NULL THEN
    search_condition := search_condition || ' AND p.price <= ' || price_max;
  END IF;

  -- Filtres par marque
  IF brands IS NOT NULL AND array_length(brands, 1) > 0 THEN
    search_condition := search_condition || 
      ' AND p.metadata->>''brand'' = ANY(' || quote_literal(brands) || ')';
  END IF;

  -- Filtres par rating
  IF ratings_min IS NOT NULL THEN
    search_condition := search_condition || 
      ' AND (p.metadata->>''rating'')::DECIMAL >= ' || ratings_min;
  END IF;

  -- Filtre stock seulement
  IF in_stock_only THEN
    search_condition := search_condition || 
      ' AND (p.track_quantity = false OR p.quantity > 0)';
  END IF;

  -- Construire la clause ORDER BY
  sort_clause := 'ORDER BY ';
  CASE sort_by
    WHEN 'price' THEN
      sort_clause := sort_clause || 'p.price ' || sort_order;
    WHEN 'rating' THEN
      sort_clause := sort_clause || '(p.metadata->>''rating'')::DECIMAL ' || sort_order || ' NULLS LAST';
    WHEN 'newest' THEN
      sort_clause := sort_clause || 'p.created_at ' || sort_order;
    WHEN 'popular' THEN
      sort_clause := sort_clause || '(p.metadata->>''view_count'')::INTEGER ' || sort_order || ' NULLS LAST';
    ELSE -- relevance par défaut
      IF search_query IS NOT NULL THEN
        sort_clause := sort_clause || 'ts_rank(p.search_vector, plainto_tsquery(''french'', ' || quote_literal(search_query) || ')) ' || sort_order;
      ELSE
        sort_clause := sort_clause || 'p.created_at DESC';
      END IF;
  END CASE;

  -- Compter le total des résultats
  EXECUTE 'SELECT COUNT(*) FROM products p ' || search_condition 
  INTO total_count;

  -- Récupérer les produits avec pagination
  EXECUTE '
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.compare_price,
      p.images,
      p.specifications,
      p.metadata,
      p.quantity,
      p.track_quantity,
      p.is_available,
      p.created_at,
      c.name as category_name,
      c.slug as category_slug,
      u.username as seller_username,
      sp.store_name as seller_store_name,
      COALESCE((p.metadata->>''rating'')::DECIMAL, 0) as rating,
      COALESCE((p.metadata->>''review_count'')::INTEGER, 0) as review_count,
      ts_rank(p.search_vector, plainto_tsquery(''french'', $1)) as relevance
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN seller_profiles sp ON p.user_id = sp.user_id
    ' || search_condition || '
    ' || sort_clause || '
    LIMIT ' || page_size || ' OFFSET ' || offset_val
  USING search_query
  INTO products_result;

  -- Retourner les résultats avec métadonnées de pagination
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(products_result, '[]'::JSON),
    'pagination', json_build_object(
      'total', total_count,
      'page', page_number,
      'page_size', page_size,
      'total_pages', CEIL(total_count::DECIMAL / page_size),
      'has_next', (page_number * page_size) < total_count,
      'has_prev', page_number > 1
    ),
    'filters', json_build_object(
      'search_query', search_query,
      'category_ids', category_ids,
      'price_min', price_min,
      'price_max', price_max,
      'brands', brands,
      'ratings_min', ratings_min,
      'in_stock_only', in_stock_only
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      details,
      created_at
    ) VALUES (
      'search_products',
      SQLERRM,
      json_build_object(
        'search_query', search_query,
        'category_ids', category_ids
      ),
      NOW()
    );
    
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors de la recherche',
      'data', '[]'::JSON,
      'pagination', json_build_object(
        'total', 0,
        'page', page_number,
        'page_size', page_size,
        'total_pages', 0,
        'has_next', false,
        'has_prev', false
      )
    );
END;
$$;
