'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    if (!isAdmin) {
      router.push('/')
      return
    }
    loadDashboardData()
  }, [isAdmin, router])

  const loadDashboardData = async () => {
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/orders/recent'),
        fetch('/api/admin/products/top')
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (ordersRes.ok) setRecentOrders((await ordersRes.json()).orders || [])
      if (productsRes.ok) setTopProducts((await productsRes.json()).products || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--red)' }}>
          ⚠️ Accès non autorisé
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--gray)' }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Chargement du dashboard...
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Chiffre d\'affaires',
      value: `${(stats.totalRevenue || 0).toLocaleString('fr-FR')} FCFA`,
      change: '+12%',
      icon: '💰',
      color: 'var(--green)'
    },
    {
      title: 'Commandes',
      value: (stats.totalOrders || 0).toLocaleString('fr-FR'),
      change: '+8%',
      icon: '📦',
      color: 'var(--orange)'
    },
    {
      title: 'Utilisateurs',
      value: (stats.totalUsers || 0).toLocaleString('fr-FR'),
      change: '+15%',
      icon: '👥',
      color: 'var(--blue)'
    },
    {
      title: 'Produits',
      value: (stats.totalProducts || 0).toLocaleString('fr-FR'),
      change: '+5%',
      icon: '🛍️',
      color: 'var(--purple)'
    }
  ]

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '20px 15px' }}>
        {/* En-tête */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: 'var(--dark)'
          }}>
            👑 Tableau de Bord Admin
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '16px' }}>
            Aperçu complet de votre marketplace
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {statCards.map((card, index) => (
            <div key={index} style={{
              background: 'var(--white)',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow)',
              borderLeft: `4px solid ${card.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--dark)' }}>
                    {card.value}
                  </div>
                </div>
                <div style={{
                  background: card.color,
                  color: 'var(--white)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {card.icon}
                </div>
              </div>
              <div style={{
                color: card.change.startsWith('+') ? 'var(--green)' : 'var(--red)',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {card.change} vs mois dernier
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '30px'
        }}>
          {/* Commandes récentes */}
          <div style={{
            background: 'var(--white)',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                📋 Commandes Récentes
              </h2>
              <button
                onClick={() => router.push('/admin/orders')}
                style={{
                  background: 'var(--orange)',
                  color: 'var(--white)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Voir tout
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentOrders.slice(0, 5).map(order => (
                <div key={order.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-lighter)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--orange)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--white)',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    #{order.order_number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {order.user?.firstName} {order.user?.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {order.total_amount?.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div style={{
                      background: order.status === 'delivered' ? '#d1fae5' : 
                                 order.status === 'shipped' ? '#dbeafe' : '#fef3c7',
                      color: order.status === 'delivered' ? '#065f46' :
                            order.status === 'shipped' ? '#1e40af' : '#92400e',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {order.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produits populaires */}
          <div style={{
            background: 'var(--white)',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              🏆 Produits Populaires
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topProducts.slice(0, 5).map(product => (
                <div key={product.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <img 
                    src={product.images?.[0]} 
                    alt={product.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', lineHeight: 1.3 }}>
                      {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      {product.sold_count} ventes
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--orange)' }}>
                    {product.price?.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            ⚡ Actions Rapides
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {[
              { label: 'Gérer les produits', icon: '🛍️', path: '/admin/products', color: 'var(--orange)' },
              { label: 'Voir les commandes', icon: '📦', path: '/admin/orders', color: 'var(--blue)' },
              { label: 'Gérer les utilisateurs', icon: '👥', path: '/admin/users', color: 'var(--green)' },
              { label: 'Analytics', icon: '📊', path: '/admin/analytics', color: 'var(--purple)' }
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.path)}
                style={{
                  background: 'var(--white)',
                  border: `2px solid ${action.color}`,
                  padding: '20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = action.color
                  e.target.style.color = 'var(--white)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'var(--white)'
                  e.target.style.color = 'inherit'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{action.icon}</div>
                <div style={{ fontWeight: '500' }}>{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
