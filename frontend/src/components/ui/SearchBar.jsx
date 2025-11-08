'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/hooks/useSearch'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedCategory, setSelectedCategory] useState('all')
  const inputRef = useRef(null)
  const router = useRouter()
  const { suggestions, recentSearches, searchProducts, clearRecentSearches } = useSearch()

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'electronics', label: 'Électronique' },
    { value: 'fashion', label: 'Mode' },
    { value: 'home', label: 'Maison' },
    { value: 'sports', label: 'Sports' },
    { value: 'beauty', label: 'Beauté' },
    { value: 'automotive', label: 'Auto & Moto' },
    { value: 'djassa', label: 'Djassa' }
  ]

  useEffect(() => {
    if (query.length > 2) {
      searchProducts(query, selectedCategory)
    }
  }, [query, selectedCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      const params = new URLSearchParams()
      params.set('search', query)
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      router.push(`/products?${params.toString()}`)
      setIsFocused(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    router.push(`/products?search=${encodeURIComponent(suggestion)}`)
    setIsFocused(false)
  }

  const handleCategorySearch = (category) => {
    router.push(`/products?category=${category}`)
    setIsFocused(false)
  }

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'fr-FR'
      
      recognition.onstart = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
              message: 'Parlez maintenant...',
              type: 'info'
            }
          }))
        }
      }
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        inputRef.current?.focus()
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
      }
      
      recognition.start()
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            message: 'Recherche vocale non supportée',
            type: 'warning'
          }
        }))
      }
    }
  }

  const popularSearches = [
    'iPhone 14',
    'Samsung Galaxy',
    'Air Jordan',
    'TV LED',
    'Laptop Gaming',
    'Perruque brésilienne',
    'Parfum homme',
    'Sneakers'
  ]

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          background: 'var(--white)',
          border: '2px solid var(--orange)',
          borderRadius: '8px',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Sélecteur de catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '12px 15px',
              background: '#F8F8F8',
              border: 'none',
              borderRight: '1px solid var(--gray-lighter)',
              fontSize: '14px',
              color: 'var(--gray-dark)',
              outline: 'none',
              minWidth: '140px',
              cursor: 'pointer'
            }}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Champ de recherche */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Rechercher un produit, une marque, une catégorie..."
            style={{
              flex: 1,
              padding: '12px 15px',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              background: 'transparent'
            }}
          />

          {/* Boutons d'action */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Recherche vocale */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              style={{
                padding: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--gray)',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.color = 'var(--orange)'}
              onMouseOut={(e) => e.target.style.color = 'var(--gray)'}
            >
              <i className="fas fa-microphone"></i>
            </button>

            {/* Bouton recherche */}
            <button
              type="submit"
              style={{
                background: 'var(--orange)',
                color: 'var(--white)',
                padding: '12px 20px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = 'var(--orange-dark)'}
              onMouseOut={(e) => e.target.style.background = 'var(--orange)'}
            >
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions */}
      {isFocused && (suggestions.length > 0 || recentSearches.length > 0 || query.length === 0) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--white)',
          border: '1px solid var(--gray-lighter)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-hover)',
          marginTop: '8px',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* Recherches récentes */}
          {recentSearches.length > 0 && query.length === 0 && (
            <div style={{ padding: '15px', borderBottom: '1px solid var(--gray-lighter)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-dark)' }}>
                  RECHERCHES RÉCENTES
                </h3>
                <button
                  onClick={clearRecentSearches}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--orange)',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Effacer
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    <span>
                      <i className="fas fa-clock" style={{ marginRight: '8px', color: 'var(--gray)', fontSize: '12px' }}></i>
                      {search}
                    </span>
                    <i className="fas fa-arrow-up" style={{ fontSize: '12px', color: 'var(--gray)' }}></i>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions en temps réel */}
          {suggestions.length > 0 && query.length > 0 && (
            <div style={{ padding: '15px', borderBottom: '1px solid var(--gray-lighter)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-dark)', marginBottom: '10px' }}>
                SUGGESTIONS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    <i className="fas fa-search" style={{ marginRight: '8px', color: 'var(--gray)', fontSize: '12px' }}></i>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recherches populaires */}
          {query.length === 0 && (
            <div style={{ padding: '15px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-dark)', marginBottom: '10px' }}>
                RECHERCHES POPULAIRES
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid var(--gray-lighter)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'var(--orange)'
                      e.target.style.color = 'var(--white)'
                      e.target.style.borderColor = 'var(--orange)'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#f8f9fa'
                      e.target.style.color = 'inherit'
                      e.target.style.borderColor = 'var(--gray-lighter)'
                    }}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Catégories rapides */}
          {query.length === 0 && (
            <div style={{ padding: '15px', borderTop: '1px solid var(--gray-lighter)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-dark)', marginBottom: '10px' }}>
                CATÉGORIES RAPIDES
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {categories.slice(1, 7).map(category => (
                  <button
                    key={category.value}
                    onClick={() => handleCategorySearch(category.value)}
                    style={{
                      background: 'var(--white)',
                      border: '1px solid var(--gray-lighter)',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'var(--orange)'
                      e.target.style.color = 'var(--white)'
                      e.target.style.borderColor = 'var(--orange)'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'var(--white)'
                      e.target.style.color = 'inherit'
                      e.target.style.borderColor = 'var(--gray-lighter)'
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
