'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import CheckoutSteps from '@/components/checkout/CheckoutSteps'
import ShippingForm from '@/components/checkout/ShippingForm'
import PaymentForm from '@/components/checkout/PaymentForm'
import OrderSummary from '@/components/checkout/OrderSummary'

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [shippingData, setShippingData] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const { items, totalAmount, clearCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Rediriger si panier vide
    if (items.length === 0 && currentStep === 1) {
      router.push('/cart')
    }
    
    // Rediriger si non authentifié
    if (!isAuthenticated && currentStep >= 2) {
      router.push('/login?redirect=/checkout')
    }
  }, [items, isAuthenticated, currentStep, router])

  const steps = [
    { number: 1, title: 'Panier', completed: currentStep > 1 },
    { number: 2, title: 'Livraison', completed: currentStep > 2 },
    { number: 3, title: 'Paiement', completed: currentStep > 3 },
    { number: 4, title: 'Confirmation', completed: false }
  ]

  const handleShippingSubmit = async (data) => {
    setShippingData(data)
    setCurrentStep(3)
  }

  const handlePaymentSubmit = async (data) => {
    setLoading(true)
    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping: shippingData,
        payment: data,
        total_amount: totalAmount,
        user_id: user?.id
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buysell_token')}`
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const order = await response.json()
        setPaymentData(data)
        setCurrentStep(4)
        
        // Vider le panier après commande réussie
        clearCart()
        
        // Notification de succès
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
              message: 'Commande confirmée avec succès !',
              type: 'success'
            }
          }))
        }
      } else {
        throw new Error('Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            message: 'Erreur lors du traitement de la commande',
            type: 'error'
          }
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛒</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
              Vérification du panier
            </h2>
            <p style={{ color: 'var(--gray)', marginBottom: '30px' }}>
              Votre panier contient {items.length} article{items.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setCurrentStep(2)}
              style={{
                background: 'var(--orange)',
                color: 'var(--white)',
                padding: '15px 30px',
                border: 'none',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Continuer vers la livraison
            </button>
          </div>
        )

      case 2:
        return (
          <ShippingForm 
            onSubmit={handleShippingSubmit}
            initialData={shippingData}
            user={user}
          />
        )

      case 3:
        return (
          <PaymentForm 
            onSubmit={handlePaymentSubmit}
            totalAmount={totalAmount}
            loading={loading}
          />
        )

      case 4:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--green)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--white)',
              fontSize: '32px'
            }}>
              <i className="fas fa-check"></i>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>
              Commande Confirmée !
            </h2>
            <p style={{ color: 'var(--gray)', marginBottom: '10px', fontSize: '18px' }}>
              Merci pour votre achat, {user?.firstName} !
            </p>
            <p style={{ color: 'var(--gray)', marginBottom: '30px' }}>
              Un email de confirmation a été envoyé à {user?.email}
            </p>
            
            <div style={{
              background: '#f0f9ff',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              textAlign: 'left',
              maxWidth: '400px',
              margin: '0 auto 30px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                📦 Suivi de commande
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--gray)' }}>
                Vous recevrez un email avec votre numéro de suivi dès que votre commande sera expédiée.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/profile/orders')}
                style={{
                  background: 'var(--orange)',
                  color: 'var(--white)',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-clipboard-list" style={{ marginRight: '8px' }}></i>
                Voir mes commandes
              </button>
              <button
                onClick={() => router.push('/products')}
                style={{
                  background: 'transparent',
                  color: 'var(--orange)',
                  border: '2px solid var(--orange)',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-shopping-bag" style={{ marginRight: '8px' }}></i>
                Continuer mes achats
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '20px 15px' }}>
        {/* Étapes */}
        <CheckoutSteps 
          steps={steps} 
          currentStep={currentStep}
        />

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: currentStep === 4 ? '1fr' : '1fr 350px', 
          gap: '30px',
          marginTop: '30px'
        }}>
          {/* Contenu de l'étape */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '30px',
            minHeight: '400px'
          }}>
            {renderStepContent()}
          </div>

          {/* Récapitulatif de commande (sauf confirmation) */}
          {currentStep !== 4 && (
            <div style={{ position: 'sticky', top: '20px' }}>
              <OrderSummary 
                items={items}
                totalAmount={totalAmount}
                shippingData={shippingData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
