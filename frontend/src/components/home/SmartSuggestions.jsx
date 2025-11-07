'use client'
import { useEffect, useState } from 'react'
import { useRecommendations } from '@/hooks/useRecommendations'
import ProductCard from '@/components/products/ProductCard'

export default function SmartSuggestions() {
  const { recommendations } = useRecommendations()
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    // Détection automatique du pays
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        setUserLocation(data.country_code)
      })
      .catch(() => setUserLocation('CI')) // Fallback Côte d'Ivoire
  }, [])

  const getLocationBasedSuggestions = () => {
    if (!userLocation) return recommendations.popular
    
    const locationPreferences = {
      'CI': ['téléphonie', 'mode', 'électronique'],
      'SN': ['mode', 'maison', 'beauté'],
      'CM': ['informatique', 'auto', 'sport'],
      'GH': ['électronique', 'mode', 'maison']
    }
    
    const preferredCategories = locationPreferences[userLocation] || locationPreferences['CI']
    return recommendations.popular?.filter(product => 
      preferredCategories.includes(product.category?.slug)
    ) || []
  }

  return (
    <div>
      {/* Suggestions basées sur la localisation */}
      <section style={{ marginBottom: '40px' }}>
        <div className="container">
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {userLocation === 'CI' ? '🔥 POPULAIRE EN CÔTE D\'IVOIRE' : '🔥 TENDANCES'}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {getLocationBasedSuggestions().slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Catégories populaires */}
      <section style={{ marginBottom: '40px' }}>
        <div className="container">
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            🏪 CATÉGORIES TENDANCES
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            padding: '0 15px'
          }}>
            {recommendations.categories?.slice(0, 8).map(category => (
              <a 
                key={category.id}
                href={`/categories/${category.slug}`}
                style={{
                  background: 'var(--white)',
                  padding: '20px 15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, var(--orange), #FF8C00)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: 'var(--white)',
                  fontSize: '20px'
                }}>
                  <i className={`fas fa-${getCategoryIcon(category.slug)}`}></i>
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {category.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--gray)',
                  marginTop: '5px'
                }}>
                  {category.product_count} produits
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function getCategoryIcon(slug) {
  const icons = {
    'telephonie': 'mobile-alt',
    'informatique': 'laptop',
    'mode': 'tshirt',
    'maison': 'home',
    'sport': 'futbol',
    'beaute': 'spa',
    'auto': 'car',
    'electromenager': 'blender',
    'bebe': 'baby',
    'supermarche': 'shopping-basket'
  }
  return icons[slug] || 'shopping-bag'
}
