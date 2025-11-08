'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const UserContext = createContext()

export function UserProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [userPreferences, setUserPreferences] = useState({})
  const [userActivity, setUserActivity] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData()
    } else {
      // Charger les données du localStorage pour les utilisateurs non connectés
      loadLocalUserData()
    }
  }, [isAuthenticated, user])

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('buysell_token')
      
      const [prefsRes, wishlistRes, activityRes] = await Promise.all([
        fetch('/api/user/preferences', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/activity', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (prefsRes.ok) {
        const prefsData = await prefsRes.json()
        setUserPreferences(prefsData.preferences || {})
      }

      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json()
        setWishlist(wishlistData.items || [])
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setUserActivity(activityData.activities || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadLocalUserData = () => {
    const localWishlist = localStorage.getItem('buysell_wishlist')
    const localRecent = localStorage.getItem('buysell_recently_viewed')
    const localPrefs = localStorage.getItem('buysell_preferences')

    if (localWishlist) setWishlist(JSON.parse(localWishlist))
    if (localRecent) setRecentlyViewed(JSON.parse(localRecent))
    if (localPrefs) setUserPreferences(JSON.parse(localPrefs))
  }

  const addToWishlist = async (product) => {
    const wishlistItem = {
      id: product.id,
      product_id: product.id,
      added_at: new Date().toISOString(),
      product: {
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category
      }
    }

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('buysell_token')
        const response = await fetch('/api/user/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: product.id })
        })

        if (response.ok) {
          setWishlist(prev => {
            const updated = [...prev, wishlistItem]
            localStorage.setItem('buysell_wishlist', JSON.stringify(updated))
            return updated
          })
        }
      } catch (error) {
        console.error('Error adding to wishlist:', error)
      }
    } else {
      setWishlist(prev => {
        const updated = [...prev.filter(item => item.id !== product.id), wishlistItem]
        localStorage.setItem('buysell_wishlist', JSON.stringify(updated))
        return updated
      })
    }
  }

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('buysell_token')
        await fetch('/api/user/wishlist', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: productId })
        })
      } catch (error) {
        console.error('Error removing from wishlist:', error)
      }
    }

    setWishlist(prev => {
      const updated = prev.filter(item => item.id !== productId)
      localStorage.setItem('buysell_wishlist', JSON.stringify(updated))
      return updated
    })
  }

  const addToRecentlyViewed = (product) => {
    const viewedItem = {
      id: product.id,
      product_id: product.id,
      viewed_at: new Date().toISOString(),
      product: {
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category
      }
    }

    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item.id !== product.id)
      const updated = [viewedItem, ...filtered].slice(0, 20) // Garder 20 articles max
      localStorage.setItem('buysell_recently_viewed', JSON.stringify(updated))
      return updated
    })
  }

  const updatePreferences = async (newPreferences) => {
    const updatedPrefs = { ...userPreferences, ...newPreferences }

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('buysell_token')
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ preferences: updatedPrefs })
        })
      } catch (error) {
        console.error('Error updating preferences:', error)
      }
    }

    setUserPreferences(updatedPrefs)
    localStorage.setItem('buysell_preferences', JSON.stringify(updatedPrefs))
  }

  const trackUserActivity = (action, data = {}) => {
    const activity = {
      action,
      timestamp: new Date().toISOString(),
      data,
      user_agent: navigator.userAgent
    }

    setUserActivity(prev => {
      const updated = [activity, ...prev].slice(0, 100) // Garder 100 activités max
      
      if (isAuthenticated) {
        // Envoyer l'activité au serveur
        fetch('/api/user/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('buysell_token')}`
          },
          body: JSON.stringify(activity)
        }).catch(console.error)
      }
      
      return updated
    })
  }

  const getRecommendations = () => {
    // Algorithm simple de recommandation basé sur l'historique
    const viewedCategories = recentlyViewed.map(item => item.product.category?.slug).filter(Boolean)
    const wishlistCategories = wishlist.map(item => item.product.category?.slug).filter(Boolean)
    
    const allCategories = [...viewedCategories, ...wishlistCategories]
    const categoryCount = allCategories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    const preferredCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    return {
      preferredCategories,
      basedOnWishlist: wishlist.slice(0, 5),
      basedOnHistory: recentlyViewed.slice(0, 5)
    }
  }

  const value = {
    // État utilisateur
    userPreferences,
    userActivity,
    wishlist,
    recentlyViewed,

    // Actions
    addToWishlist,
    removeFromWishlist,
    addToRecentlyViewed,
    updatePreferences,
    trackUserActivity,
    getRecommendations,

    // Utilitaires
    isInWishlist: (productId) => wishlist.some(item => item.id === productId),
    hasRecentlyViewed: (productId) => recentlyViewed.some(item => item.id === productId),
    wishlistCount: wishlist.length
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
