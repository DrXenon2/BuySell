'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import SearchBar from '@/components/ui/SearchBar'
import Navigation from '@/components/layout/Navigation'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const { itemsCount } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
  }

  return (
    <>
      {/* Header Top */}
      <div style={{
        background: 'var(--black)',
        color: 'var(--white)',
        padding: '8px 0',
        fontSize: '12px',
        transition: 'all 0.3s ease'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/become-seller" style={{ color: 'inherit', textDecoration: 'none' }}>
                <i className="fas fa-store" style={{ marginRight: '5px' }}></i>
                Devenir Vendeur
              </Link>
              <Link href="/support" style={{ color: 'inherit', textDecoration: 'none' }}>
                <i className="fas fa-question-circle" style={{ marginRight: '5px' }}></i>
                Centre d'Aide
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <span>🇨🇮 Livraison en Côte d'Ivoire</span>
              {!isAuthenticated ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Connexion
                  </Link>
                  <span style={{ color: 'var(--gray-light)' }}>|</span>
                  <Link href="/register" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Inscription
                  </Link>
                </div>
              ) : (
                <span>Bienvenue, {user?.firstName}!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header style={{
        background: 'var(--white)',
        padding: '15px 0',
        boxShadow: isScrolled ? '0 2px 20px rgba(0,0,0,0.1)' : 'none',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'var(--orange)'
              }}>
                <span style={{ color: 'var(--black)' }}>Buy</span>Sell
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div style={{
              flex: 1,
              maxWidth: '600px',
              margin: '0 20px',
              display: { xs: 'none', lg: 'block' }
            }}>
              <SearchBar />
            </div>

            {/* User Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Favoris */}
              <Link 
                href="/profile/wishlist" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  fontSize: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  position: 'relative'
                }}
              >
                <i className="fas fa-heart" style={{ fontSize: '20px', marginBottom: '4px' }}></i>
                <span>Favoris</span>
              </Link>

              {/* Panier */}
              <Link 
                href="/cart" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  fontSize: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  position: 'relative'
                }}
              >
                <i className="fas fa-shopping-cart" style={{ fontSize: '20px', marginBottom: '4px' }}></i>
                <span>Panier</span>
                {itemsCount > 0 && (
                  <div style={{
                    background: 'var(--orange)',
                    color: 'var(--white)',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px'
                  }}>
                    {itemsCount}
                  </div>
                )}
              </Link>

              {/* Menu Utilisateur */}
              {isAuthenticated ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'var(--orange)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--white)',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {user?.firstName?.charAt(0)}
                    </div>
                    <i className="fas fa-chevron-down" style={{ fontSize: '12px' }}></i>
                  </button>

                  {isUserMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'var(--white)',
                      border: '1px solid var(--gray-lighter)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-hover)',
                      minWidth: '200px',
                      zIndex: 1001,
                      marginTop: '10px'
                    }}>
                      <div style={{ padding: '15px', borderBottom: '1px solid var(--gray-lighter)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                          {user.email}
                        </div>
                      </div>
                      
                      <div style={{ padding: '10px 0' }}>
                        <Link 
                          href="/profile"
                          style={{
                            display: 'block',
                            padding: '10px 15px',
                            textDecoration: 'none',
                            color: 'var(--dark)',
                            fontSize: '14px'
                          }}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
                          Mon profil
                        </Link>
                        <Link 
                          href="/profile/orders"
                          style={{
                            display: 'block',
                            padding: '10px 15px',
                            textDecoration: 'none',
                            color: 'var(--dark)',
                            fontSize: '14px'
                          }}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="fas fa-clipboard-list" style={{ marginRight: '8px' }}></i>
                          Mes commandes
                        </Link>
                        {user.role === 'seller' && (
                          <Link 
                            href="/dashboard/seller"
                            style={{
                              display: 'block',
                              padding: '10px 15px',
                              textDecoration: 'none',
                              color: 'var(--dark)',
                              fontSize: '14px'
                            }}
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <i className="fas fa-chart-line" style={{ marginRight: '8px' }}></i>
                            Dashboard vendeur
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link 
                            href="/admin"
                            style={{
                              display: 'block',
                              padding: '10px 15px',
                              textDecoration: 'none',
                              color: 'var(--dark)',
                              fontSize: '14px'
                            }}
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <i className="fas fa-crown" style={{ marginRight: '8px' }}></i>
                            Administration
                          </Link>
                        )}
                      </div>

                      <div style={{ padding: '10px 0', borderTop: '1px solid var(--gray-lighter)' }}>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            padding: '10px 15px',
                            color: 'var(--red)',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/login"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontSize: '12px',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <i className="fas fa-user" style={{ fontSize: '20px', marginBottom: '4px' }}></i>
                  <span>Compte</span>
                </Link>
              )}

              {/* Menu Mobile Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  display: { lg: 'none' },
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: 'var(--gray)',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div style={{ 
            display: { lg: 'none' }, 
            marginTop: '15px'
          }}>
            <SearchBar />
          </div>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--white)',
            zIndex: 1002,
            padding: '20px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'var(--orange)'
                }}>
                  <span style={{ color: 'var(--black)' }}>Buy</span>Sell
                </div>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: 'var(--gray)',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Menu mobile content */}
            <nav style={{ marginBottom: '30px' }}>
              {['Boutiques Officielles', 'Djassa', 'Mode', 'Électronique', 'Maison', 'Super marché'].map(item => (
                <Link
                  key={item}
                  href={`/categories/${item.toLowerCase().replace(' ', '-')}`}
                  style={{
                    display: 'block',
                    padding: '15px 0',
                    borderBottom: '1px solid var(--gray-lighter)',
                    textDecoration: 'none',
                    color: 'var(--dark)',
                    fontSize: '16px'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Actions utilisateur mobile */}
            <div style={{
              borderTop: '1px solid var(--gray-lighter)',
              paddingTop: '20px'
            }}>
              {isAuthenticated ? (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                      {user.email}
                    </div>
                  </div>
                  {[
                    { label: 'Mon profil', href: '/profile', icon: 'user' },
                    { label: 'Mes commandes', href: '/profile/orders', icon: 'clipboard-list' },
                    { label: 'Mes favoris', href: '/profile/wishlist', icon: 'heart' },
                    ...(user.role === 'seller' ? [{ label: 'Dashboard vendeur', href: '/dashboard/seller', icon: 'chart-line' }] : []),
                    ...(user.role === 'admin' ? [{ label: 'Administration', href: '/admin', icon: 'crown' }] : [])
                  ].map(item => (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 0',
                        textDecoration: 'none',
                        color: 'var(--dark)',
                        fontSize: '14px'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <i className={`fas fa-${item.icon}`} style={{ width: '20px' }}></i>
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '12px 0',
                      color: 'var(--red)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i>
                    Déconnexion
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href="/login"
                    style={{
                      flex: 1,
                      background: 'var(--orange)',
                      color: 'var(--white)',
                      padding: '12px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      color: 'var(--orange)',
                      border: '2px solid var(--orange)',
                      padding: '12px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Overlay pour menu mobile */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1001
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
