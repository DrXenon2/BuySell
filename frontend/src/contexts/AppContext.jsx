'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [appState, setAppState] = useState({
    isOnline: true,
    isLoading: false,
    currentCountry: 'ci',
    language: 'fr',
    currency: 'FCFA',
    maintenanceMode: false,
    newFeatures: []
  })

  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Vérifier la connexion internet
  useEffect(() => {
    const handleOnline = () => setAppState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setAppState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Charger la configuration de l'application
  useEffect(() => {
    loadAppConfig()
  }, [])

  const loadAppConfig = async () => {
    try {
      const response = await fetch('/api/app/config')
      if (response.ok) {
        const config = await response.json()
        setAppState(prev => ({ ...prev, ...config }))
      }
    } catch (error) {
      console.error('Error loading app config:', error)
    }
  }

  const setLoading = useCallback((loading) => {
    setAppState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setCountry = useCallback((countryCode) => {
    setAppState(prev => ({ ...prev, currentCountry: countryCode }))
    localStorage.setItem('buysell_country', countryCode)
  }, [])

  const setLanguage = useCallback((language) => {
    setAppState(prev => ({ ...prev, language }))
    localStorage.setItem('buysell_language', language)
  }, [])

  const openQuickView = useCallback((product) => {
    setQuickViewProduct(product)
    setIsQuickViewOpen(true)
    
    // Track this activity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trackUserActivity', {
        detail: {
          action: 'quick_view',
          product_id: product.id
        }
      }))
    }
  }, [])

  const closeQuickView = useCallback(() => {
    setIsQuickViewOpen(false)
    setTimeout(() => setQuickViewProduct(null), 300) // Delay for animation
  }, [])

  const toggleMobileFilters = useCallback(() => {
    setMobileFiltersOpen(prev => !prev)
  }, [])

  // Gestionnaire d'erreurs global
  const handleError = useCallback((error, context = 'global') => {
    console.error(`[${context}]`, error)
    
    // Envoyer l'erreur à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          context,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(console.error)
    }

    // Afficher une notification à l'utilisateur
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          message: 'Une erreur est survenue. Veuillez réessayer.',
          type: 'error'
        }
      }))
    }
  }, [])

  // Utilitaires pour les pays
  const countries = {
    ci: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "FCFA", shipping: 1000 },
    sn: { name: "Sénégal", flag: "🇸🇳", currency: "FCFA", shipping: 1500 },
    cm: { name: "Cameroun", flag: "🇨🇲", currency: "FCFA", shipping: 2000 },
    gh: { name: "Ghana", flag: "🇬🇭", currency: "GHS", shipping: 15 }
  }

  const getCurrentCountry = () => countries[appState.currentCountry] || countries.ci

  // Formatage des prix selon la devise
  const formatPrice = useCallback((price) => {
    const country = getCurrentCountry()
    if (country.currency === 'FCFA') {
      return `${price.toLocaleString('fr-FR')} FCFA`
    }
    return `${price.toLocaleString('fr-FR')} ${country.currency}`
  }, [appState.currentCountry])

  // Gestion des fonctionnalités
  const hasFeature = useCallback((featureName) => {
    return appState.newFeatures.includes(featureName)
  }, [appState.newFeatures])

  const enableFeature = useCallback((featureName) => {
    setAppState(prev => ({
      ...prev,
      newFeatures: [...prev.newFeatures, featureName]
    }))
  }, [])

  const disableFeature = useCallback((featureName) => {
    setAppState(prev => ({
      ...prev,
      newFeatures: prev.newFeatures.filter(f => f !== featureName)
    }))
  }, [])

  const value = {
    // État global
    appState,
    
    // UI States
    quickViewProduct,
    isQuickViewOpen,
    mobileFiltersOpen,
    
    // Actions
    setLoading,
    setCountry,
    setLanguage,
    openQuickView,
    closeQuickView,
    toggleMobileFilters,
    handleError,
    
    // Utilitaires
    formatPrice,
    getCurrentCountry,
    countries,
    
    // Gestion des fonctionnalités
    hasFeature,
    enableFeature,
    disableFeature
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
