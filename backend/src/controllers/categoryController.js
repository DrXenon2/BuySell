
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class CategoryController {
  // Obtenir toutes les catégories
  async getCategories(req, res) {
    try {
      const { include_products = false, parent_id = null } = req.query;

      let query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (parent_id) {
        query = query.eq('parent_id', parent_id);
      } else {
        query = query.is('parent_id', null);
      }

      const { data: categories, error } = await query;

      if (error) {
        throw error;
      }

      // Inclure les produits si demandé
      if (include_products === 'true') {
        for (let category of categories) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, slug, price, images')
            .eq('category_id', category.id)
            .eq('is_published', true)
            .eq('is_available', true)
            .limit(8);

          category.products = products || [];
        }
      }

      res.json({
        success: true,
        data: { categories }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getCategories:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des catégories'
      });
    }
  }

  // Obtenir une catégorie par ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const { include_children = false } = req.query;

      const { data: category, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Catégorie non trouvée',
            message: 'La catégorie demandée n\'existe pas'
          });
        }
        throw error;
      }

      let children = [];
      let products = [];

      // Inclure les sous-catégories si demandé
      if (include_children === 'true') {
        const { data: subcategories } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        children = subcategories || [];
      }

      // Obtenir les produits de cette catégorie
      const { data: categoryProducts } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          compare_price,
          images,
          specifications,
          metadata,
          profiles (first_name, last_name),
          seller_profiles (store_name)
        `)
        .eq('category_id', id)
        .eq('is_published', true)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(50);

      products = categoryProducts || [];

      res.json({
        success: true,
        data: {
          category: {
            ...category,
            children,
            products
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getCategoryById:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la catégorie'
      });
    }
  }

  // Obtenir une catégorie par slug
  async getCategoryBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query;
      const offset = (page - 1) * limit;

      // Obtenir la catégorie
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (categoryError || !category) {
        return res.status(404).json({
          error: 'Catégorie non trouvée',
          message: 'La catégorie demandée n\'existe pas'
        });
      }

      // Obtenir les produits avec pagination
      const { data: products, error: productsError, count } = await supabase
        .from('products')
        .select(`
          *,
          profiles (first_name, last_name),
          seller_profiles (store_name)
        `, { count: 'exact' })
        .eq('category_id', category.id)
        .eq('is_published', true)
        .eq('is_available', true)
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(offset, offset + limit - 1);

      if (productsError) {
        throw productsError;
      }

      // Obtenir les sous-catégories
      const { data: subcategories } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      res.json({
        success: true,
        data: {
          category: {
            ...category,
            subcategories: subcategories || []
          },
          products: products || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getCategoryBySlug:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la catégorie'
      });
    }
  }

  // Créer une nouvelle catégorie (admin seulement)
  async createCategory(req, res) {
    try {
      const { name, description, parent_id, image_url, sort_order = 0, metadata } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Nom manquant',
          message: 'Le nom de la catégorie est requis'
        });
      }

      // Générer le slug
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          name,
          slug,
          description,
          parent_id: parent_id || null,
          image_url,
          sort_order,
          metadata: metadata || {},
          is_active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Catégorie existante',
            message: 'Une catégorie avec ce nom existe déjà'
          });
        }
        throw error;
      }

      logger.info('Nouvelle catégorie créée', { 
        categoryId: category.id, 
        name: category.name,
        adminId: req.user.id 
      });

      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: { category }
      });

    } catch (error) {
      logger.error('Erreur contrôleur createCategory:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création de la catégorie'
      });
    }
  }

  // Mettre à jour une catégorie (admin seulement)
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier que la catégorie existe
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', id)
        .single();

      if (!existingCategory) {
        return res.status(404).json({
          error: 'Catégorie non trouvée',
          message: 'La catégorie demandée n\'existe pas'
        });
      }

      // Générer un nouveau slug si le nom change
      if (updateData.name) {
        updateData.slug = updateData.name.toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }

      const { data: category, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Catégorie mise à jour', { 
        categoryId: id, 
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Catégorie mise à jour avec succès',
        data: { category }
      });

    } catch (error) {
      logger.error('Erreur contrôleur updateCategory:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour de la catégorie'
      });
    }
  }

  // Supprimer une catégorie (admin seulement)
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Vérifier que la catégorie existe
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingCategory) {
        return res.status(404).json({
          error: 'Catégorie non trouvée',
          message: 'La catégorie demandée n\'existe pas'
        });
      }

      // Vérifier s'il y a des produits dans cette catégorie
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      if (productsCount > 0) {
        return res.status(400).json({
          error: 'Catégorie non vide',
          message: 'Impossible de supprimer une catégorie contenant des produits'
        });
      }

      // Vérifier s'il y a des sous-catégories
      const { count: subcategoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', id);

      if (subcategoriesCount > 0) {
        return res.status(400).json({
          error: 'Catégorie avec sous-catégories',
          message: 'Impossible de supprimer une catégorie contenant des sous-catégories'
        });
      }

      // Soft delete
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw error;
      }

      logger.info('Catégorie supprimée', { 
        categoryId: id, 
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Catégorie supprimée avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur deleteCategory:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression de la catégorie'
      });
    }
  }

  // Obtenir l'arborescence des catégories
  async getCategoryTree(req, res) {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('parent_id', { ascending: true, nullsFirst: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      // Construire l'arborescence
      const categoryTree = this.buildCategoryTree(categories);

      res.json({
        success: true,
        data: { categories: categoryTree }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getCategoryTree:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de l\'arborescence'
      });
    }
  }

  buildCategoryTree(categories, parentId = null) {
    return categories
      .filter(category => category.parent_id === parentId)
      .map(category => ({
        ...category,
        children: this.buildCategoryTree(categories, category.id)
      }));
  }
}

module.exports = new CategoryController();
