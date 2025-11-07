'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { useAuth } from '@/hooks/useAuth'
import ProductCard from '@/components/products/ProductCard'
import FlashSales from '@/components/home/FlashSales'
import CategoryShowcase from '@/components/home/CategoryShowcase'

export default function HomePage() {
  const { featuredProducts, officialStoreProducts, djassaProducts, loading, loadHomepageData } = useProducts()
  const { user } = useAuth()
  const [flashSales, setFlashSales] = useState([])

  useEffect(() => {
    loadHomepageData()
    loadFlashSales()
  }, [])

  const loadFlashSales = async () => {
    try {
      const response = await fetch('/api/flash-sales')
      if (response.ok) {
        const data = await response.json()
        setFlashSales(data.products)
      }
    } catch (error) {
      console.error('Error loading flash sales:', error)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--orange), #FF8C00)',
        color: 'var(--white)',
        padding: '60px 0',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <div className="container">
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            BLACK FRIDAY EXCLUSIF
          </h1>
          <p style={{
            fontSize: '20px',
            marginBottom: '30px',
            opacity: 0.9
          }}>
            Jusqu'à -70% sur 50,000+ produits | Livraison à 1,000 FCFA
          </p>
          <Link href="/flash-sales" style={{
            background: 'var(--white)',
            color: 'var(--orange)',
            padding: '15px 30px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.3s',
            display: 'inline-block',
            textDecoration: 'none'
          }}>
            VOIR LES OFFRES <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </Link>
        </div>
      </section>

      {/* Ventes Flash */}
      <FlashSales products={flashSales} />

      {/* Catégories Populaires */}
      <CategoryShowcase />

      {/* Boutiques Officielles */}
      <section style={{ marginBottom: '40px' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '0 15px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'var(--dark)'
            }}>
              🏪 BOUTIQUES OFFICIELLES
            </h2>
            <Link href="/boutiques-officielles" style={{
              color: 'var(--orange)',
              fontWeight: 500,
              textDecoration: 'none'
            }}>
              Voir tout <i className="fas fa-chevron-right" style={{ marginLeft: '5px' }}></i>
            </Link>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
            padding: '0 15px'
          }}>
            {officialStoreProducts.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Section Djassa */}
      <section style={{ 
        marginBottom: '40px',
        background: 'linear-gradient(45deg, #00A650, #00C853)',
        padding: '40px 0'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '0 15px'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'var(--white)',
                marginBottom: '8px'
              }}>
                🔄 DJASSA - SECONDE MAIN
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.9)' }}>
                Économisez jusqu'à 70% sur des produits de qualité vérifiée
              </p>
            </div>
            <Link href="/djassa" style={{
              background: 'var(--white)',
              color: 'var(--green)',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none'
            }}>
              Explorer Djassa
            </Link>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
            padding: '0 15px'
          }}>
            {djassaProducts.slice(0, 6).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Produits en Vedette */}
      <section style={{ marginBottom: '40px' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '0 15px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'var(--dark)'
            }}>
              🔥 MEILLEURES VENTES
            </h2>
            <Link href="/produits" style={{
              color: 'var(--orange)',
              fontWeight: 500,
              textDecoration: 'none'
            }}>
              Voir tout <i className="fas fa-chevron-right" style={{ marginLeft: '5px' }}></i>
            </Link>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
            padding: '0 15px'
          }}>
            {featuredProducts.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Services Buysell */}
      <section style={{ 
        background: 'var(--white)',
        padding: '40px 0',
        marginBottom: '40px'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            🚀 POURQUOI CHOISIR BUYSELL ?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            textAlign: 'center'
          }}>
            <div style={{ padding: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'var(--orange)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                color: 'var(--white)',
                fontSize: '24px'
              }}>
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Paiement Sécurisé</h3>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                Transactions 100% sécurisées avec cryptage SSL
              </p>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'var(--green)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                color: 'var(--white)',
                fontSize: '24px'
              }}>
                <i className="fas fa-truck"></i>
              </div>
              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Livraison Express</h3>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                Livraison en 24h dans les grandes villes
              </p>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'var(--blue)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                color: 'var(--white)',
                fontSize: '24px'
              }}>
                <i className="fas fa-undo"></i>
              </div>
              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Retours Faciles</h3>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                30 jours satisfait ou remboursé
              </p>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'var(--red)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                color: 'var(--white)',
                fontSize: '24px'
              }}>
                <i className="fas fa-headset"></i>
              </div>
              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Support 24/7</h3>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                Assistance client toujours disponible
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{
        background: 'var(--orange)',
        color: 'var(--white)',
        padding: '40px 0'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            📧 RESTEZ INFORMÉ
          </h3>
          <p style={{
            marginBottom: '25px',
            fontSize: '16px',
            opacity: 0.9
          }}>
            Recevez les meilleures offres et nouveautés en avant-première
          </p>
          <div style={{
            maxWidth: '400px',
            margin: '0 auto',
            display: 'flex'
          }}>
            <input
              type="email"
              placeholder="Votre adresse email"
              style={{
                flex: 1,
                padding: '12px 15px',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button style={{
              background: 'var(--dark)',
              color: 'var(--white)',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              S'abonner
            </button>
          </div>
          <p style={{
            marginTop: '15px',
            fontSize: '12px',
            opacity: 0.8
          }}>
            En vous abonnant, vous acceptez notre politique de confidentialité
          </p>
        </div>
      </section>
    </div>
  )
}
