'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { useAuth } from '@/contexts/AuthContext'
import ProductCard from '@/components/products/ProductCard'
import FlashSales from '@/components/home/FlashSales'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import OfficialStores from '@/components/home/OfficialStores'
import DjassaSection from '@/components/home/DjassaSection'
import SmartSuggestions from '@/components/home/SmartSuggestions'

export default function HomePage() {
  const { featuredProducts, officialStoreProducts, djassaProducts, loading, loadHomepageData } = useProducts()
  const { user, isAuthenticated } = useAuth()
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 1247,
    ordersToday: 892,
    newProducts: 156
  })

  useEffect(() => {
    loadHomepageData()
    startRealTimeUpdates()
  }, [])

  const startRealTimeUpdates = () => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        ordersToday: prev.ordersToday + Math.floor(Math.random() * 5),
        newProducts: prev.newProducts + Math.floor(Math.random() * 3)
      }))
    }, 10000)

    return () => clearInterval(interval)
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            color: 'var(--orange)',
            marginBottom: '20px'
          }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div style={{ fontSize: '18px', color: 'var(--gray)' }}>
            Chargement de votre expérience Buysell...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Bannière Stats Temps Réel */}
      <div style={{
        background: 'var(--dark)',
        color: 'var(--white)',
        padding: '10px 0',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <span>👥 {realTimeData.activeUsers.toLocaleString()} acheteurs en ligne</span>
            <span>📦 {realTimeData.ordersToday} commandes aujourd'hui</span>
            <span>🆕 {realTimeData.newProducts} nouveaux produits</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--orange), #FF8C00)',
        color: 'var(--white)',
        padding: '80px 0 60px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <div className="container">
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 'bold',
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            lineHeight: 1.2
          }}>
            BIENVENUE SUR<br />BUYSELL MARKETPLACE
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            marginBottom: '30px',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            La plus grande marketplace d'Afrique de l'Ouest<br />
            {featuredProducts.length.toLocaleString()}+ produits neufs et d'occasion
          </p>
          
          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" style={{
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
              🛍️ Acheter maintenant
            </Link>
            {!isAuthenticated && (
              <Link href="/register" style={{
                background: 'transparent',
                color: 'var(--white)',
                border: '2px solid var(--white)',
                padding: '15px 30px',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                display: 'inline-block',
                textDecoration: 'none'
              }}>
                🏪 Devenir vendeur
              </Link>
            )}
          </div>

          {/* Features */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '50px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚚</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Livraison Express</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>24-48h dans les grandes villes</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Paiement Sécurisé</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Mobile Money & Cartes</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>↩️</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Retours Gratuits</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>30 jours satisfait ou remboursé</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Support 24/7</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Assistance en direct</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ventes Flash */}
      <FlashSales />

      {/* Catégories Populaires */}
      <CategoryShowcase />

      {/* Suggestions Intelligentes */}
      <SmartSuggestions />

      {/* Boutiques Officielles */}
      <OfficialStores products={officialStoreProducts} />

      {/* Section Djassa */}
      <DjassaSection products={djassaProducts} />

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
              ⭐ PRODUITS POPULAIRES
            </h2>
            <Link href="/products" style={{
              color: 'var(--orange)',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              Voir tout <i className="fas fa-chevron-right"></i>
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

      {/* Pourquoi Choisir Buysell */}
      <section style={{ 
        background: 'var(--white)',
        padding: '60px 0',
        marginBottom: '40px'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px',
            color: 'var(--dark)'
          }}>
            🚀 POURQUOI CHOISIR BUYSELL ?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, var(--orange), #FF8C00)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--white)',
                fontSize: '32px'
              }}>
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Achat 100% Sécurisé</h3>
              <p style={{ color: 'var(--gray)', lineHeight: 1.6 }}>
                Paiements cryptés SSL, protection des données, et système anti-fraude avancé pour des transactions en toute confiance.
              </p>
            </div>
            
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, var(--green), #00C853)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--white)',
                fontSize: '32px'
              }}>
                <i className="fas fa-truck"></i>
              </div>
              <h3 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Livraison Rapide</h3>
              <p style={{ color: 'var(--gray)', lineHeight: 1.6 }}>
                Réseau de livraison couvrant toute l'Afrique de l'Ouest. Livraison express en 24h disponible.
              </p>
            </div>
            
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, var(--blue), #0677E8)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--white)',
                fontSize: '32px'
              }}>
                <i className="fas fa-undo"></i>
              </div>
              <h3 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Retours Faciles</h3>
              <p style={{ color: 'var(--gray)', lineHeight: 1.6 }}>
                Politique de retour flexible : 30 jours satisfait ou remboursé. Processus simplifié et rapide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section style={{ 
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'var(--white)',
        padding: '60px 0',
        marginBottom: '40px'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            💬 CE QUE DISENT NOS CLIENTS
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {[
              {
                name: "Fatou Diop",
                location: "Dakar, Sénégal",
                comment: "J'ai acheté mon iPhone sur Buysell. Livraison rapide et produit parfait ! Je recommande vivement.",
                rating: 5
              },
              {
                name: "Jean Kouassi",
                location: "Abidjan, Côte d'Ivoire",
                comment: "Plateforme intuitive et sécurisée. Le système de paiement mobile money est très pratique.",
                rating: 5
              },
              {
                name: "Aïcha Bello",
                location: "Cotonou, Bénin",
                comment: "Vendeuse sur Buysell depuis 6 mois. Excellente visibilité et support réactif. Revenus stables.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '30px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'var(--white)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--orange)',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginRight: '15px'
                  }}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{testimonial.name}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>{testimonial.location}</div>
                  </div>
                </div>
                <div style={{ 
                  color: 'var(--yellow)',
                  marginBottom: '15px'
                }}>
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p style={{ lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{testimonial.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{
        background: 'var(--orange)',
        color: 'var(--white)',
        padding: '60px 0'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h3 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            📧 RESTEZ INFORMÉ
          </h3>
          <p style={{
            marginBottom: '30px',
            fontSize: '16px',
            opacity: 0.9,
            maxWidth: '500px',
            margin: '0 auto 30px'
          }}>
            Recevez en avant-première les meilleures offres, nouveautés et promotions exclusives
          </p>
          <div style={{
            maxWidth: '400px',
            margin: '0 auto',
            display: 'flex',
            background: 'var(--white)',
            borderRadius: '25px',
            overflow: 'hidden'
          }}>
            <input
              type="email"
              placeholder="Votre adresse email"
              style={{
                flex: 1,
                padding: '15px 20px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                background: 'transparent'
              }}
            />
            <button style={{
              background: 'var(--dark)',
              color: 'var(--white)',
              padding: '15px 25px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              S'abonner
            </button>
          </div>
          <p style={{
            marginTop: '15px',
            fontSize: '12px',
            opacity: 0.8
          }}>
            🔒 Nous respectons votre vie privée. Désabonnez-vous à tout moment.
          </p>
        </div>
      </section>
    </div>
  )
}
