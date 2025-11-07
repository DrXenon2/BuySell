'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount, itemsCount, loading } = useCart()
  const { isAuthenticated, user } = useAuth()
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    loadSuggestions()
  }, [items])

  const loadSuggestions = async () => {
    if (items.length === 0) return
    
    try {
      const category = items[0]?.product?.category_id
      const response = await fetch(`/api/products/suggestions?category=${category}&limit=4`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.products || [])
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId)
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = (itemId) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          message: 'Produit retiré du panier',
          type: 'info'
        }
      }))
    }
    removeFromCart(itemId)
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--gray)' }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Chargement du panier...
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px', color: 'var(--gray-lighter)' }}>
            🛒
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>
            Votre panier est vide
          </h1>
          <p style={{ color: 'var(--gray)', marginBottom: '30px', fontSize: '16px' }}>
            Découvrez nos produits populaires et commencez vos achats
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" style={{
              background: 'var(--orange)',
              color: 'var(--white)',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              🛍️ Découvrir les produits
            </Link>
            <Link href="/categories" style={{
              background: 'transparent',
              color: 'var(--orange)',
              border: '2px solid var(--orange)',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              📂 Parcourir les catégories
            </Link>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: '50px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
              Produits populaires
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {suggestions.slice(0, 4).map(product => (
                <Link 
                  key={product.id}
                  href={`/products/${product.id}`}
                  style={{
                    background: 'var(--white)',
                    padding: '15px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: 'var(--shadow)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <img 
                    src={product.images?.[0]} 
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  />
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '5px' }}>
                    {product.name.length > 50 ? product.name.substring(0, 50) + '...' : product.name}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--orange)' }}>
                    {product.price?.toLocaleString('fr-FR')} FCFA
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '20px 15px' }}>
        {/* En-tête */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: 'var(--dark)'
          }}>
            🛒 Mon Panier
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '16px' }}>
            {itemsCount} article{itemsCount > 1 ? 's' : ''} dans votre panier
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 350px', 
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Liste des articles */}
          <div>
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  Articles sélectionnés
                </h2>
                <button
                  onClick={clearCart}
                  style={{
                    background: 'transparent',
                    color: 'var(--red)',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <i className="fas fa-trash"></i>
                  Vider le panier
                </button>
              </div>
            </div>

            {/* Articles du panier */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            {/* Livraison estimée */}
            <div style={{
              background: '#f0f9ff',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '20px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <i className="fas fa-shipping-fast" style={{ color: 'var(--blue)' }}></i>
                <span style={{ fontWeight: 'bold' }}>Livraison estimée</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                • Abidjan : 1-2 jours ouvrables<br/>
                • Autres villes : 3-5 jours ouvrables<br/>
                • Retrait en point relais : 24h
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <CartSummary 
              items={items}
              totalAmount={totalAmount}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>

        {/* Suggestions d'achats complémentaires */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              🎁 COMPLÉTEZ VOTRE COMMANDE
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {suggestions.map(product => (
                <Link 
                  key={product.id}
                  href={`/products/${product.id}`}
                  style={{
                    background: 'var(--white)',
                    padding: '15px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: 'var(--shadow)',
                    transition: 'all 0.3s ease',
                    border: '1px solid var(--gray-lighter)'
                  }}
                >
                  <img 
                    src={product.images?.[0]} 
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  />
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '5px', lineHeight: 1.3 }}>
                    {product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--orange)' }}>
                    {product.price?.toLocaleString('fr-FR')} FCFA
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
