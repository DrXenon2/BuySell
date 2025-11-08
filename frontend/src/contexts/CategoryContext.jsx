'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CategoryContext = createContext()

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [featuredCategories, setFeaturedCategories] = useState([])
  const [officialStoreCategories, setOfficialStoreCategories] = useState([])
  const [djassaCategories, setDjassaCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryStats, setCategoryStats] = useState({})

  // Charger toutes les catégories au démarrage
  useEffect(() => {
    loadAllCategories()
    loadCategoryStats()
  }, [])

  const loadAllCategories = async () => {
    setLoading(true)
    try {
      const [allCategoriesRes, featuredRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/categories/featured')
      ])

      if (allCategoriesRes.ok) {
        const data = await allCategoriesRes.json()
        setCategories(data.categories || [])
        
        // Séparer les catégories par type
        const official = data.categories.filter(cat => cat.is_official_store)
        const djassa = data.categories.filter(cat => cat.is_djassa)
        
        setOfficialStoreCategories(official)
        setDjassaCategories(djassa)
      }

      if (featuredRes.ok) {
        const data = await featuredRes.json()
        setFeaturedCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback data pour le développement
      setCategories(getFallbackCategories())
      setFeaturedCategories(getFallbackCategories().slice(0, 6))
      setOfficialStoreCategories(getFallbackCategories().filter(cat => cat.is_official_store))
      setDjassaCategories(getFallbackCategories().filter(cat => cat.is_djassa))
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryStats = async () => {
    try {
      const response = await fetch('/api/categories/stats')
      if (response.ok) {
        const data = await response.json()
        setCategoryStats(data.stats || {})
      }
    } catch (error) {
      console.error('Error loading category stats:', error)
    }
  }

  const getCategoryBySlug = useCallback((slug) => {
    return categories.find(cat => cat.slug === slug)
  }, [categories])

  const getSubcategories = useCallback((parentId) => {
    return categories.filter(cat => cat.parent_id === parentId)
  }, [categories])

  const getCategoryProducts = async (categorySlug, filters = {}) => {
    try {
      const params = new URLSearchParams({
        category: categorySlug,
        ...filters
      })
      
      const response = await fetch(`/api/categories/${categorySlug}/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        return data.products || []
      }
      return []
    } catch (error) {
      console.error('Error loading category products:', error)
      return []
    }
  }

  const getCategoryTree = useCallback(() => {
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }))
    }
    
    return buildTree(categories)
  }, [categories])

  const getBreadcrumb = useCallback((categorySlug) => {
    const category = getCategoryBySlug(categorySlug)
    if (!category) return []

    const breadcrumb = [category]
    let currentCategory = category
    
    while (currentCategory.parent_id) {
      const parent = categories.find(cat => cat.id === currentCategory.parent_id)
      if (parent) {
        breadcrumb.unshift(parent)
        currentCategory = parent
      } else {
        break
      }
    }

    // Ajouter la racine "Accueil"
    breadcrumb.unshift({ name: 'Accueil', slug: '', is_root: true })

    return breadcrumb
  }, [categories, getCategoryBySlug])

  const getPopularCategories = useCallback((limit = 8) => {
    return categories
      .filter(cat => !cat.parent_id) // Catégories principales seulement
      .sort((a, b) => (categoryStats[b.id]?.product_count || 0) - (categoryStats[a.id]?.product_count || 0))
      .slice(0, limit)
  }, [categories, categoryStats])

  const searchCategories = useCallback((query) => {
    if (!query.trim()) return categories.filter(cat => !cat.parent_id)
    
    const searchTerm = query.toLowerCase()
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm) ||
      cat.description?.toLowerCase().includes(searchTerm)
    )
  }, [categories])

  const updateCategoryStats = useCallback((categoryId, stats) => {
    setCategoryStats(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        ...stats
      }
    }))
  }, [])

  const incrementCategoryView = useCallback(async (categoryId) => {
    // Mettre à jour localement
    updateCategoryStats(categoryId, {
      view_count: (categoryStats[categoryId]?.view_count || 0) + 1
    })

    // Envoyer au serveur
    try {
      await fetch('/api/categories/stats/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId })
      })
    } catch (error) {
      console.error('Error tracking category view:', error)
    }
  }, [categoryStats, updateCategoryStats])

  const value = {
    // États
    categories,
    featuredCategories,
    officialStoreCategories,
    djassaCategories,
    loading,
    selectedCategory,
    categoryStats,

    // Actions
    setSelectedCategory,
    getCategoryBySlug,
    getSubcategories,
    getCategoryProducts,
    getCategoryTree,
    getBreadcrumb,
    getPopularCategories,
    searchCategories,
    incrementCategoryView,
    updateCategoryStats,
    refreshCategories: loadAllCategories,

    // Utilitaires
    hasSubcategories: (categoryId) => getSubcategories(categoryId).length > 0,
    getCategoryIcon: (category) => getCategoryIcon(category.slug),
    getCategoryColor: (category) => getCategoryColor(category.slug)
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategory() {
  const context = useContext(CategoryContext)
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider')
  }
  return context
}

// Fonctions utilitaires pour les catégories
function getCategoryIcon(slug) {
  const icons = {
    'telephonie': 'mobile-alt',
    'informatique': 'laptop',
    'electronique': 'tv',
    'electromenager': 'blender',
    'mode-homme': 'tshirt',
    'mode-femme': 'tshirt',
    'mode-enfant': 'child',
    'chaussures': 'shoe-prints',
    'sports': 'futbol',
    'maison': 'home',
    'decoration': 'couch',
    'jardin': 'tree',
    'beaute': 'spa',
    'sante': 'heartbeat',
    'auto-moto': 'car',
    'bebe': 'baby',
    'jouets': 'gamepad',
    'livres': 'book',
    'supermarche': 'shopping-basket',
    'djassa': 'recycle'
  }
  return icons[slug] || 'shopping-bag'
}

function getCategoryColor(slug) {
  const colors = {
    'telephonie': '#FF6000',
    'informatique': '#0677E8',
    'electronique': '#00A650',
    'electromenager': '#FFD700',
    'mode-homme': '#E91E63',
    'mode-femme': '#9C27B0',
    'sports': '#4CAF50',
    'maison': '#795548',
    'beaute': '#FF9800',
    'auto-moto': '#607D8B',
    'djassa': '#00C853'
  }
  return colors[slug] || '#666666'
}

// Données de fallback pour le développement
function getFallbackCategories() {
  return [
    {
      id: '1',
      name: 'Téléphonie & Tablettes',
      slug: 'telephonie',
      description: 'Smartphones, tablettes et accessoires',
      image_url: '/images/categories/electronics.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: false,
      sort_order: 1,
      product_count: 1250
    },
    {
      id: '2',
      name: 'Informatique',
      slug: 'informatique',
      description: 'Ordinateurs, composants et périphériques',
      image_url: '/images/categories/computers.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: false,
      sort_order: 2,
      product_count: 890
    },
    {
      id: '3',
      name: 'Mode Homme',
      slug: 'mode-homme',
      description: 'Vêtements, chaussures et accessoires pour homme',
      image_url: '/images/categories/men-fashion.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: true,
      sort_order: 3,
      product_count: 2100
    },
    {
      id: '4',
      name: 'Mode Femme',
      slug: 'mode-femme',
      description: 'Vêtements, chaussures et accessoires pour femme',
      image_url: '/images/categories/women-fashion.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: true,
      sort_order: 4,
      product_count: 1850
    },
    {
      id: '5',
      name: 'Maison & Bureau',
      slug: 'maison',
      description: 'Meubles, décoration et électroménager',
      image_url: '/images/categories/home.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: false,
      sort_order: 5,
      product_count: 760
    },
    {
      id: '6',
      name: 'Sports & Loisirs',
      slug: 'sports',
      description: 'Équipements sportifs et articles de loisir',
      image_url: '/images/categories/sports.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: true,
      sort_order: 6,
      product_count: 540
    },
    {
      id: '7',
      name: 'Beauté & Hygiène',
      slug: 'beaute',
      description: 'Cosmétiques, soins et produits d\'hygiène',
      image_url: '/images/categories/beauty.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: false,
      sort_order: 7,
      product_count: 980
    },
    {
      id: '8',
      name: 'Auto & Moto',
      slug: 'auto-moto',
      description: 'Pièces détachées et accessoires automobile',
      image_url: '/images/categories/automotive.jpg',
      parent_id: null,
      is_official_store: true,
      is_djassa: true,
      sort_order: 8,
      product_count: 320
    },
    {
      id: '9',
      name: 'Djassa - Seconde Main',
      slug: 'djassa',
      description: 'Produits d\'occasion vérifiés et garantis',
      image_url: '/images/categories/second-hand.jpg',
      parent_id: null,
      is_official_store: false,
      is_djassa: true,
      sort_order: 9,
      product_count: 4500
    },
    {
      id: '10',
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Smartphones neufs et reconditionnés',
      image_url: null,
      parent_id: '1',
      is_official_store: true,
      is_djassa: true,
      sort_order: 1,
      product_count: 850
    },
    {
      id: '11',
      name: 'Accessoires Téléphonie',
      slug: 'accessoires-telephonie',
      description: 'Coques, chargeurs, écouteurs',
      image_url: null,
      parent_id: '1',
      is_official_store: true,
      is_djassa: true,
      sort_order: 2,
      product_count: 400
    }
  ]
}
