'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const SecondHandContext = createContext()

export function SecondHandProvider({ children }) {
  const [djassaProducts, setDjassaProducts] = useState([])
  const [featuredDjassa, setFeaturedDjassa] = useState([])
  const [djassaStats, setDjassaStats] = useState({})
  const [verificationQueue, setVerificationQueue] = useState([])
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Charger les données Djassa au démarrage
  useEffect(() => {
    loadDjassaData()
    loadVerificationQueue()
  }, [])

  const loadDjassaData = async () => {
    setLoading(true)
    try {
      const [productsRes, featuredRes, statsRes] = await Promise.all([
        fetch('/api/djassa/products'),
        fetch('/api/djassa/featured'),
        fetch('/api/djassa/stats')
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        setDjassaProducts(data.products || [])
      }

      if (featuredRes.ok) {
        const data = await featuredRes.json()
        setFeaturedDjassa(data.products || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setDjassaStats(data.stats || {})
      }
    } catch (error) {
      console.error('Error loading Djassa data:', error)
      // Fallback data
      setDjassaProducts(getFallbackDjassaProducts())
      setFeaturedDjassa(getFallbackDjassaProducts().slice(0, 6))
      setDjassaStats({
        total_products: 4500,
        verified_sellers: 1250,
        avg_savings: 65,
        total_transactions: 89000
      })
    } finally {
      setLoading(false)
    }
  }

  const loadVerificationQueue = async () => {
    if (!isAuthenticated || user?.role !== 'admin') return

    try {
      const response = await fetch('/api/djassa/verification-queue', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buysell_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setVerificationQueue(data.queue || [])
      }
    } catch (error) {
      console.error('Error loading verification queue:', error)
    }
  }

  const getDjassaProduct = useCallback((productId) => {
    return djassaProducts.find(product => product.id === productId)
  }, [djassaProducts])

  const getDjassaProductsByCategory = useCallback((categorySlug) => {
    return djassaProducts.filter(product => product.category?.slug === categorySlug)
  }, [djassaProducts])

  const searchDjassaProducts = async (query, filters = {}) => {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      })
      
      const response = await fetch(`/api/djassa/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        return data.products || []
      }
      return []
    } catch (error) {
      console.error('Error searching Djassa products:', error)
      return djassaProducts.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())
      )
    }
  }

  const submitForVerification = async (productData) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour soumettre un produit Djassa')
    }

    try {
      const response = await fetch('/api/djassa/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buysell_token')}`
        },
        body: JSON.stringify({
          ...productData,
          condition: 'used',
          is_second_hand: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mettre à jour les stats localement
        setDjassaStats(prev => ({
          ...prev,
          total_products: (prev.total_products || 0) + 1,
          pending_verification: (prev.pending_verification || 0) + 1
        }))

        return { success: true, product: data.product }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error submitting product for verification:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const verifyProduct = async (productId, status, notes = '') => {
    if (!isAuthenticated || user?.role !== 'admin') {
      throw new Error('Accès non autorisé')
    }

    try {
      const response = await fetch('/api/djassa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buysell_token')}`
        },
        body: JSON.stringify({
          product_id: productId,
          status, // 'approved', 'rejected', 'needs_review'
          notes,
          verified_by: user.id
        })
      })

      if (response.ok) {
        // Mettre à jour la file d'attente locale
        setVerificationQueue(prev => prev.filter(item => item.id !== productId))
        
        // Mettre à jour les stats
        setDjassaStats(prev => ({
          ...prev,
          pending_verification: (prev.pending_verification || 1) - 1,
          verified_today: (prev.verified_today || 0) + 1
        }))

        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error verifying product:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const reportProduct = async (productId, reason, description = '') => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour signaler un produit')
    }

    try {
      const response = await fetch('/api/djassa/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buysell_token')}`
        },
        body: JSON.stringify({
          product_id: productId,
          reason,
          description,
          reported_by: user.id
        })
      })

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error reporting product:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const getConditionLabel = useCallback((condition) => {
    const conditions = {
      'like_new': 'Comme neuf',
      'excellent': 'Excellent état',
      'good': 'Bon état',
      'fair': 'État correct',
      'needs_repair': 'Nécessite réparation'
    }
    return conditions[condition] || condition
  })

  const getConditionColor = useCallback((condition) => {
    const colors = {
      'like_new': '#00C853',
      'excellent': '#4CAF50',
      'good': '#FF9800',
      'fair': '#FF6D00',
      'needs_repair': '#F44336'
    }
    return colors[condition] || '#666666'
  })

  const calculateSavings = useCallback((originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return 0
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
  }, [])

  const getDjassaBenefits = () => [
    {
      icon: '🔍',
      title: 'Vérification Qualité',
      description: 'Tous les produits sont inspectés et vérifiés par notre équipe'
    },
    {
      icon: '💰',
      title: 'Économies Garanties',
      description: 'Jusqu\'à 70% d\'économie par rapport au prix neuf'
    },
    {
      icon: '🛡️',
      title: 'Garantie Djassa',
      description: 'Protection acheteur et garantie de satisfaction'
    },
    {
      icon: '🌱',
      title: 'Écologique',
      description: 'Contribuez à l\'économie circulaire et réduisez le gaspillage'
    }
  ]

  const getVerificationCriteria = () => [
    'État du produit conforme à la description',
    'Fonctionnalités testées et opérationnelles',
    'Photos claires et représentatives',
    'Prix juste et compétitif',
    'Vendeur vérifié et noté'
  ]

  const trackDjassaView = useCallback(async (productId) => {
    // Mettre à jour localement
    setDjassaStats(prev => ({
      ...prev,
      total_views: (prev.total_views || 0) + 1
    }))

    // Envoyer au serveur
    try {
      await fetch('/api/djassa/stats/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      })
    } catch (error) {
      console.error('Error tracking Djassa view:', error)
    }
  }, [])

  const value = {
    // États
    djassaProducts,
    featuredDjassa,
    djassaStats,
    verificationQueue,
    loading,

    // Actions
    getDjassaProduct,
    getDjassaProductsByCategory,
    searchDjassaProducts,
    submitForVerification,
    verifyProduct,
    reportProduct,
    refreshDjassa: loadDjassaData,

    // Utilitaires
    getConditionLabel,
    getConditionColor,
    calculateSavings,
    getDjassaBenefits,
    getVerificationCriteria,
    trackDjassaView,

    // Vérifications
    canSubmitProduct: isAuthenticated,
    canVerifyProducts: isAuthenticated && user?.role === 'admin',
    isDjassaProduct: (product) => product?.is_second_hand === true
  }

  return (
    <SecondHandContext.Provider value={value}>
      {children}
    </SecondHandContext.Provider>
  )
}

export function useSecondHand() {
  const context = useContext(SecondHandContext)
  if (!context) {
    throw new Error('useSecondHand must be used within a SecondHandProvider')
  }
  return context
}

// Données de fallback pour le développement
function getFallbackDjassaProducts() {
  return [
    {
      id: 'djassa-1',
      name: "iPhone 13 Pro 128GB - État comme neuf",
      price: 450000,
      original_price: 750000,
      images: ["https://images.unsplash.com/photo-1632661674598-2fd40dcccd99?w=400&h=400&fit=crop"],
      category: { name: "Téléphonie", slug: "telephonie" },
      brand: "Apple",
      condition: "like_new",
      stock_quantity: 1,
      rating: 4.8,
      review_count: 12,
      is_second_hand: true,
      is_verified: true,
      verification_date: "2024-01-15",
      seller: {
        name: "TechRecycle CI",
        verified: true,
        rating: 4.9,
        djassa_seller: true
      },
      specifications: {
        ecran: "6.1 pouces Super Retina XDR",
        stockage: "128GB",
        couleur: "Graphite",
        autonomie: "Batterie à 95%"
      }
    },
    {
      id: 'djassa-2',
      name: "Nike Air Force 1 - Taille 42 - Excellent état",
      price: 35000,
      original_price: 80000,
      images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"],
      category: { name: "Chaussures", slug: "chaussures" },
      brand: "Nike",
      condition: "excellent",
      stock_quantity: 1,
      rating: 4.6,
      review_count: 8,
      is_second_hand: true,
      is_verified: true,
      seller: {
        name: "SneakerLover",
        verified: true,
        rating: 4.7,
        djassa_seller: true
      }
    },
    {
      id: 'djassa-3',
      name: "Canon EOS 2000D + Objectif 18-55mm",
      price: 180000,
      original_price: 280000,
      images: ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop"],
      category: { name: "Photo & Vidéo", slug: "electronique" },
      brand: "Canon",
      condition: "good",
      stock_quantity: 1,
      rating: 4.4,
      review_count: 5,
      is_second_hand: true,
      is_verified: true,
      seller: {
        name: "PhotoPassion",
        verified: true,
        rating: 4.5,
        djassa_seller: true
      }
    },
    {
      id: 'djassa-4',
      name: "Sac à main Louis Vuitton Neverfull MM",
      price: 1200000,
      original_price: 1800000,
      images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop"],
      category: { name: "Maroquinerie", slug: "mode-femme" },
      brand: "Louis Vuitton",
      condition: "excellent",
      stock_quantity: 1,
      rating: 4.9,
      review_count: 3,
      is_second_hand: true,
      is_verified: true,
      seller: {
        name: "LuxeAuthentic",
        verified: true,
        rating: 5.0,
        djassa_seller: true
      }
    },
    {
      id: 'djassa-5',
      name: "MacBook Pro 13\" 2020 - i5 8GB 512GB",
      price: 550000,
      original_price: 850000,
      images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop"],
      category: { name: "Informatique", slug: "informatique" },
      brand: "Apple",
      condition: "like_new",
      stock_quantity: 1,
      rating: 4.7,
      review_count: 15,
      is_second_hand: true,
      is_verified: true,
      seller: {
        name: "MacPro CI",
        verified: true,
        rating: 4.8,
        djassa_seller: true
      }
    }
  ]
}
