'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleDemoLogin = (role) => {
    const demoAccounts = {
      customer: { email: 'client@buysell.com', password: 'password' },
      seller: { email: 'vendeur@buysell.com', password: 'password' },
      admin: { email: 'admin@buysell.com', password: 'password' }
    }
    
    setEmail(demoAccounts[role].email)
    setPassword(demoAccounts[role].password)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--white)',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Link href="/" style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'var(--orange)',
            textDecoration: 'none'
          }}>
            <span style={{ color: 'var(--black)' }}>Buy</span>Sell
          </Link>
          <p style={{ 
            color: 'var(--gray)', 
            marginTop: '8px',
            fontSize: '14px'
          }}>
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Comptes de démonstration */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <p style={{ 
            fontSize: '12px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: 'var(--gray-dark)'
          }}>
            COMPTES DE DÉMO :
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDemoLogin('customer')}
              style={{
                background: 'var(--blue)',
                color: 'var(--white)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Client
            </button>
            <button
              onClick={() => handleDemoLogin('seller')}
              style={{
                background: 'var(--green)',
                color: 'var(--white)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Vendeur
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              style={{
                background: 'var(--orange)',
                color: 'var(--white)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fee',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: 'var(--dark)',
              fontSize: '14px'
            }}>
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid var(--gray-lighter)',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'border-color 0.3s'
              }}
              placeholder="votre@email.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: 'var(--dark)',
              fontSize: '14px'
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid var(--gray-lighter)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="Votre mot de passe"
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--gray)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ margin: 0 }}
              />
              Se souvenir de moi
            </label>

            <Link href="/forgot-password" style={{
              color: 'var(--orange)',
              fontSize: '14px',
              textDecoration: 'none'
            }}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'var(--gray-light)' : 'var(--orange)',
              color: 'var(--white)',
              padding: '14px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Séparateur */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '25px 0',
          color: 'var(--gray)'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-lighter)' }}></div>
          <span style={{ padding: '0 15px', fontSize: '14px' }}>Ou</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-lighter)' }}></div>
        </div>

        {/* Connexion sociale */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button style={{
            flex: 1,
            background: '#3b5998',
            color: 'var(--white)',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <i className="fab fa-facebook-f"></i>
            Facebook
          </button>
          <button style={{
            flex: 1,
            background: '#4285f4',
            color: 'var(--white)',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <i className="fab fa-google"></i>
            Google
          </button>
        </div>

        {/* Lien d'inscription */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--gray)', fontSize: '14px' }}>
            Nouveau sur Buysell ?{' '}
          </span>
          <Link href="/register" style={{
            color: 'var(--orange)',
            fontWeight: '500',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            Créer un compte
          </Link>
        </div>

        {/* Sécurité */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
            <i className="fas fa-shield-alt" style={{ marginRight: '5px' }}></i>
            Connexion sécurisée SSL
          </div>
        </div>
      </div>
    </div>
  )
}
