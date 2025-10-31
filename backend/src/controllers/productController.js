const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class ProductController {
  // Obtenir tous les produits avec filtres et pagination
  async getProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        category, 
        min_price, 
        max_price, 
        in_stock,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, slug),
          profiles (username, first_name, last_name),
          seller_profiles (store_name, store_slug)
        `, { count: 'exact' })
        .eq('is_published', true)
        .eq('is_available', true);

      // Filtres
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (category) {
        query = query.eq('category_id', category);
      }

      if (min_price) {
        query = query.gte('price', min_price);
      }

      if (max_price) {
        query = query.lte('price', max_price);
      }

      if (in_stock === 'true') {
        query = query.or('track_quantity.eq.false,and(track_quantity.eq.true,quantity.gt.0)');
      }

      // Tri
      const validSortFields = ['created_at', 'price', 'name', 'rating'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDir = sort_order === 'asc' ? 'asc' : 'desc';

      // Pagination et tri
      const { data: products, error, count } = await query
        .order(sortField, { ascending: sortDir === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getProducts:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des produits'
      });
    }
  }

  // Obtenir un produit par ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (*),
          profiles (username, first_name, last_name, avatar_url),
          seller_profiles (*),
          reviews (
            *,
            profiles (username, first_name, last_name, avatar_url)
          )
        `)
        .eq('id', id)
        .eq('is_published', true)
        .eq('is_available', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Produit non trouvé',
            message: 'Le produit demandé n\'existe pas ou n\'est pas disponible'
          });
        }
        throw error;
      }

      // Incrémenter le compteur de vues
      await supabase.rpc('increment_product_views', { product_id: id });

      res.json({
        success: true,
        data: { product }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getProductById:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du produit'
      });
    }
  }

  // Obtenir un produit par slug
  async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;

      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (*),
          profiles (username, first_name, last_name, avatar_url),
          seller_profiles (*),
          reviews (
            *,
            profiles (username, first_name, last_name, avatar_url)
          )
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .eq('is_available', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Produit non trouvé',
            message: 'Le produit demandé n\'existe pas ou n\'est pas disponible'
          });
        }
        throw error;
      }

      // Incrémenter le compteur de vues
      await supabase.rpc('increment_product_views', { product_id: product.id });

      res.json({
        success: true,
        data: { product }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getProductBySlug:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du produit'
      });
    }
  }

  // Créer un nouveau produit (vendeur seulement)
  async createProduct(req, res) {
    try {
      const userId = req.user.id;
      const {
        name,
        description,
        price,
        compare_price,
        cost_price,
        sku,
        barcode,
        quantity,
        track_quantity,
        weight,
        dimensions,
        images,
        specifications,
        category_id,
        metadata
      } = req.body;

      // Validation des champs requis
      if (!name || !price || !category_id) {
        return res.status(400).json({
          error: 'Champs manquants',
          message: 'Le nom, le prix et la catégorie sont requis'
        });
      }

      // Générer un slug à partir du nom
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name,
          slug,
          description,
          price: parseFloat(price),
          compare_price: compare_price ? parseFloat(compare_price) : null,
          cost_price: cost_price ? parseFloat(cost_price) : null,
          sku,
          barcode,
          quantity: quantity || 0,
          track_quantity: track_quantity !== false,
          weight: weight ? parseFloat(weight) : null,
          dimensions,
          images: images || [],
          specifications: specifications || {},
          category_id,
          user_id: userId,
          metadata: metadata || {},
          is_published: true,
          is_available: true
        })
        .select(`
          *,
          categories (name, slug),
          seller_profiles (store_name, store_slug)
        `)
        .single();

      if (error) {
        if (error.code === '23505') { // Violation de contrainte unique
          return res.status(409).json({
            error: 'Produit existant',
            message: 'Un produit avec ce nom ou SKU existe déjà'
          });
        }
        throw error;
      }

      logger.info('Nouveau produit créé', { 
        productId: product.id, 
        userId,
        name: product.name 
      });

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: { product }
      });

    } catch (error) {
      logger.error('Erreur contrôleur createProduct:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du produit'
      });
    }
  }

  // Mettre à jour un produit
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Vérifier que le produit appartient à l'utilisateur ou que c'est un admin
      const { data: existingProduct } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existingProduct) {
        return res.status(404).json({
          error: 'Produit non trouvé',
          message: 'Le produit demandé n\'existe pas'
        });
      }

      if (existingProduct.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Permission refusée',
          message: 'Vous ne pouvez modifier que vos propres produits'
        });
      }

      // Champs autorisés pour la mise à jour
      const allowedFields = [
        'name', 'description', 'price', 'compare_price', 'cost_price',
        'sku', 'barcode', 'quantity', 'track_quantity', 'weight',
        'dimensions', 'images', 'specifications', 'category_id',
        'metadata', 'is_published', 'is_available'
      ];

      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      // Générer un nouveau slug si le nom change
      if (filteredData.name) {
        filteredData.slug = filteredData.name.toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }

      const { data: product, error } = await supabase
        .from('products')
        .update(filteredData)
        .eq('id', id)
        .select(`
          *,
          categories (name, slug),
          seller_profiles (store_name, store_slug)
        `)
        .single();

      if (error) {
        throw error;
      }

      logger.info('Produit mis à jour', { 
        productId: id, 
        userId 
      });

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: { product }
      });

    } catch (error) {
      logger.error('Erreur contrôleur updateProduct:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour du produit'
      });
    }
  }

  // Supprimer un produit
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier que le produit appartient à l'utilisateur ou que c'est un admin
      const { data: existingProduct } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existingProduct) {
        return res.status(404).json({
          error: 'Produit non trouvé',
          message: 'Le produit demandé n\'existe pas'
        });
      }

      if (existingProduct.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Permission refusée',
          message: 'Vous ne pouvez supprimer que vos propres produits'
        });
      }

      // Soft delete: marquer comme non publié et non disponible
      const { error } = await supabase
        .from('products')
        .update({ 
          is_published: false, 
          is_available: false 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      logger.info('Produit supprimé', { 
        productId: id, 
        userId 
      });

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur deleteProduct:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression du produit'
      });
    }
  }

  // Obtenir les produits d'un vendeur
  async getSellerProducts(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status = 'all' } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, slug)
        `, { count: 'exact' })
        .eq('user_id', id);

      // Filtrer par statut
      if (status === 'published') {
        query = query.eq('is_published', true).eq('is_available', true);
      } else if (status === 'draft') {
        query = query.eq('is_published', false);
      } else if (status === 'out_of_stock') {
        query = query.eq('is_published', true).eq('is_available', false);
      }

      const { data: products, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getSellerProducts:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des produits du vendeur'
      });
    }
  }

  // Recherche avancée de produits
  async searchProducts(req, res) {
    try {
      const { 
        q, 
        category, 
        min_price, 
        max_price, 
        brands,
        rating,
        in_stock,
        sort_by = 'relevance',
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;

      // Utiliser la fonction PostgreSQL pour la recherche avancée
      const { data: products, error } = await supabase.rpc('search_products', {
        search_query: q,
        category_ids: category ? [category] : null,
        price_min: min_price ? parseFloat(min_price) : null,
        price_max: max_price ? parseFloat(max_price) : null,
        brands: brands ? brands.split(',') : null,
        ratings_min: rating ? parseFloat(rating) : null,
        in_stock_only: in_stock === 'true',
        sort_by,
        sort_order: 'desc',
        page_number: parseInt(page),
        page_size: parseInt(limit)
      });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      logger.error('Erreur contrôleur searchProducts:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la recherche des produits'
      });
    }
  }
}

module.exports = new ProductController();
