'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    preferences: {}
  })
  const router = useRouter()

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        preferences: user.preferences || {}
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await updateProfile(formData)
    
    if (result.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            message: 'Profil mis à jour avec succès',
            type: 'success'
          }
        }))
      }
    }
    
    setLoading(false)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--gray)' }}>
          Chargement du profil...
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Commandes', value: '12', icon: '📦', link: '/profile/orders' },
    { label: 'Favoris', value: '8', icon: '❤️', link: '/profile/wishlist' },
    { label: 'Adresses', value: '2', icon: '🏠', link: '/profile/addresses' },
    { label: 'Avis', value: '5', icon: '⭐', link: '#' }
  ]

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '20px 15px' }}>
        {/* En-tête du profil */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--orange), #FF8C00)',
          color: 'var(--white)',
          padding: '40px',
          borderRadius: '12px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px',
            fontSize: '32px',
            backdropFilter: 'blur(10px)'
          }}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {user.firstName} {user.lastName}
          </h1>
          <p style={{ opacity: 0.9, marginBottom: '15px' }}>{user.email}</p>
          <div style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '8px 16px', 
            borderRadius: '20px',
            display: 'inline-block',
            fontSize: '14px',
            backdropFilter: 'blur(10px)'
          }}>
            {user.role === 'admin' ? '👑 Administrateur' : 
             user.role === 'seller' ? '🏪 Vendeur certifié' : '👤 Client'}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '250px 1fr', 
          gap: '30px'
        }}>
          {/* Navigation latérale */}
          <div>
            <nav style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              position: 'sticky',
              top: '20px'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '15px',
                fontSize: '16px',
                color: 'var(--dark)'
              }}>
                Mon Compte
              </div>
              <ul style={{ listStyle: 'none' }}>
                {[
                  { id: 'overview', label: '📊 Aperçu', icon: 'chart-bar' },
                  { id: 'personal', label: '👤 Informations', icon: 'user' },
                  { id: 'security', label: '🔒 Sécurité', icon: 'shield-alt' },
                  { id: 'preferences', label: '⚙️ Préférences', icon: 'cog' }
                ].map(item => (
                  <li key={item.id} style={{ marginBottom: '8px' }}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: activeTab === item.id ? 'var(--orange)' : 'transparent',
                        color: activeTab === item.id ? 'var(--white)' : 'var(--dark)',
                        border: 'none',
                        padding: '12px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <i className={`fas fa-${item.icon}`}></i>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              <div style={{ borderTop: '1px solid var(--gray-lighter)', margin: '20px 0', paddingTop: '20px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  fontSize: '14px',
                  color: 'var(--dark)'
                }}>
                  Actions
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    color: 'var(--red)',
                    border: 'none',
                    padding: '12px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Déconnexion
                </button>
              </div>
            </nav>
          </div>

          {/* Contenu du profil */}
          <div>
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                  📊 Aperçu du compte
                </h2>
                
                {/* Statistiques */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px',
                  marginBottom: '30px'
                }}>
                  {stats.map(stat => (
                    <div
                      key={stat.label}
                      onClick={() => stat.link && router.push(stat.link)}
                      style={{
                        background: 'var(--white)',
                        padding: '20px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow)',
                        cursor: stat.link ? 'pointer' : 'default',
                        transition: 'transform 0.3s ease',
                        border: '1px solid var(--gray-lighter)'
                      }}
                      onMouseOver={stat.link ? (e) => e.target.style.transform = 'translateY(-2px)' : undefined}
                      onMouseOut={stat.link ? (e) => e.target.style.transform = 'translateY(0)' : undefined}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Dernières activités */}
                <div style={{
                  background: 'var(--white)',
                  padding: '25px',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow)',
                  border: '1px solid var(--gray-lighter)'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                    📋 Activité récente
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { action: 'Commande #12345', date: 'Aujourd\'hui', status: 'En cours', icon: '📦' },
                      { action: 'Produit ajouté aux favoris', date: 'Hier', status: 'Favori', icon: '❤️' },
                      { action: 'Profil mis à jour', date: '12 Nov 2024', status: 'Complété', icon: '👤' }
                    ].map((activity, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        <div style={{ fontSize: '18px' }}>{activity.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500' }}>{activity.action}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{activity.date}</div>
                        </div>
                        <div style={{
                          background: activity.status === 'En cours' ? '#fef3c7' : 
                                     activity.status === 'Favori' ? '#fce7f3' : '#d1fae5',
                          color: activity.status === 'En cours' ? '#92400e' :
                                activity.status === 'Favori' ? '#be185d' : '#065f46',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {activity.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                  👤 Informations personnelles
                </h2>
                <form onSubmit={handleSubmit}>
                  <div style={{
                    background: 'var(--white)',
                    padding: '25px',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow)',
                    border: '1px solid var(--gray-lighter)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                          Prénom
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--gray-lighter)',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                          Nom
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--gray-lighter)',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid var(--gray-lighter)',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid var(--gray-lighter)',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="+225 07 07 07 07 07"
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid var(--gray-lighter)',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: loading ? 'var(--gray-light)' : 'var(--orange)',
                        color: 'var(--white)',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Autres onglets... */}
          </div>
        </div>
      </div>
    </div>
  )
}
