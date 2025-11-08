'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  const {
    id,
    name,
    price,
    original_price,
    images,
    category,
    brand,
    condition,
    stock_quantity,
    rating,
    review_count,
    is_second_hand,
    seller,
    sold_count
  } = product

  const discount = original_price ? Math.round(((original_price - price) / original_price) * 100) : 0
  const isLowStock = stock_quantity <= 10
  const stockPercentage = Math.min((sold_count / (sold_count + stock_quantity)) * 100, 100)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            message: 'Connectez-vous pour ajouter au panier',
            type: 'warning'
          }
        }))
      }
      return
    }

    setIsAddingToCart(true)
    await addToCart(product, 1)
    setIsAddingToCart(false)
  }

  const handleQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showQuickView', {
        detail: { product }
      }))
    }
  }

  const handleAddToWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            message: 'Connectez-vous pour ajouter aux favoris',
            type: 'warning'
          }
        }))
      }
      return
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('addToWishlist', {
        detail: { product }
      }))
    }
  }

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}
    className="product-card"
    >
      <Link href={`/products/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {/* Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {is_second_hand && (
            <span style={{
              background: 'var(--green)',
              color: 'var(--white)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              🔄 DJASSA
            </span>
          )}
          {discount > 0 && (
            <span style={{
              background: 'var(--red)',
              color: 'var(--white)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              -{discount}%
            </span>
          )}
          {isLowStock && stock_quantity > 0 && (
            <span style={{
              background: 'var(--orange)',
              color: 'var(--white)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              Stock faible
            </span>
          )}
          {stock_quantity === 0 && (
            <span style={{
              background: 'var(--gray)',
              color: 'var(--white)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              Rupture
            </span>
          )}
        </div>

        {/* Actions rapides */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }}
        className="product-actions"
        >
          <button
            onClick={handleAddToWishlist}
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--white)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--gray)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'var(--red)'
              e.target.style.color = 'var(--white)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'var(--white)'
              e.target.style.color = 'var(--gray)'
            }}
          >
            <i className="far fa-heart"></i>
          </button>
          <button
            onClick={handleQuickView}
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--white)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--gray)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'var(--blue)'
              e.target.style.color = 'var(--white)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'var(--white)'
              e.target.style.color = 'var(--gray)'
            }}
          >
            <i className="far fa-eye"></i>
          </button>
        </div>

        {/* Image du produit */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          background: '#F8F8F8',
          overflow: 'hidden'
        }}>
          <img
            src={imageError ? '/images/placeholder-product.jpg' : (images?.[0] || '/images/placeholder-product.jpg')}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
            className="product-image"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay au hover */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.02)',
            transition: 'background 0.3s ease'
          }}
          className="product-overlay"
          />
        </div>

        {/* Informations du produit */}
        <div style={{ padding: '15px' }}>
          {/* Catégorie et marque */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{
              fontSize: '11px',
              color: 'var(--gray)',
              textTransform: 'uppercase',
              fontWeight: '500'
            }}>
              {category?.name}
            </span>
            {brand && (
              <span style={{
                fontSize: '11px',
                color: 'var(--blue)',
                fontWeight: '500'
              }}>
                {brand}
              </span>
            )}
          </div>

          {/* Nom du produit */}
          <h3 style={{
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: 1.3,
            marginBottom: '8px',
            height: '36px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {name}
          </h3>

          {/* Vendeur */}
          {seller && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Par</span>
              <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--dark)' }}>
                {seller.verified && (
                  <i className="fas fa-check-circle" style={{ color: 'var(--blue)', marginRight: '3px' }}></i>
                )}
                {seller.store_name || seller.name}
              </span>
            </div>
          )}

          {/* Évaluation */}
          {rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', color: 'var(--yellow)' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ fontSize: '10px' }}>
                    {star <= Math.floor(rating) ? '★' : star === Math.ceil(rating) && rating % 1 !== 0 ? '½' : '☆'}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--gray)' }}>
                ({review_count?.toLocaleString('fr-FR')})
              </span>
            </div>
          )}

          {/* Prix */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--orange)'
              }}>
                {price?.toLocaleString('fr-FR')} FCFA
              </span>
              {original_price && original_price > price && (
                <span style={{
                  fontSize: '12px',
                  color: 'var(--gray)',
                  textDecoration: 'line-through'
                }}>
                  {original_price.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>
          </div>

          {/* Stock et ventes */}
          {(stock_quantity > 0 || sold_count > 0) && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--gray)', marginBottom: '4px' }}>
                <span>{sold_count?.toLocaleString('fr-FR')} vendus</span>
                {stock_quantity > 0 && <span>{stock_quantity} restants</span>}
              </div>
              {isLowStock && stock_quantity > 0 && (
                <div style={{
                  width: '100%',
                  background: '#F0F0F0',
                  height: '4px',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{
                      height: '100%',
                      background: 'var(--orange)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }}
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bouton d'action */}
          <button
            onClick={handleAddToCart}
            disabled={stock_quantity === 0 || isAddingToCart}
            style={{
              width: '100%',
              background: stock_quantity === 0 ? 'var(--gray-light)' : 
                         isAddingToCart ? 'var(--green)' : 'var(--orange)',
              color: 'var(--white)',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: stock_quantity === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              if (stock_quantity > 0 && !isAddingToCart) {
                e.target.style.background = 'var(--orange-dark)'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseOut={(e) => {
              if (stock_quantity > 0 && !isAddingToCart) {
                e.target.style.background = 'var(--orange)'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {stock_quantity === 0 ? (
              <>
                <i className="fas fa-times"></i>
                Rupture de stock
              </>
            ) : isAddingToCart ? (
              <>
                <i className="fas fa-check"></i>
                Ajouté !
              </>
            ) : (
              <>
                <i className="fas fa-cart-plus"></i>
                Ajouter au panier
              </>
            )}
          </button>
        </div>
      </Link>

      <style jsx>{`
        .product-card:hover {
          box-shadow: var(--shadow-hover);
          transform: translateY(-4px);
        }
        
        .product-card:hover .product-actions {
          opacity: 1;
        }
        
        .product-card:hover .product-image {
          transform: scale(1.05);
        }
        
        .product-card:hover .product-overlay {
          background: rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  )
}
