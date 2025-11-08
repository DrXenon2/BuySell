// app/(auth)/forgot-password/page.jsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    checkUser()
  }, [])

  // Gérer le compte à rebours
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Erreur vérification session:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Validation email côté client
      if (!isValidEmail(email)) {
        setError('Veuillez entrer une adresse email valide')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })

      if (error) {
        console.error('Erreur Supabase:', error)
        if (error.message.includes('rate limit')) {
          setError('Trop de tentatives. Veuillez réessayer dans quelques minutes.')
        } else if (error.message.includes('email')) {
          setError('Aucun compte trouvé avec cette adresse email.')
        } else {
          setError('Erreur lors de l\'envoi du lien. Veuillez réessayer.')
        }
      } else {
        setMessage('Un lien de réinitialisation a été envoyé à votre adresse email.')
        setCountdown(60) // 60 secondes avant de pouvoir renvoyer
        // Logger l'action
        await logPasswordResetRequest(email)
      }
    } catch (error) {
      console.error('Erreur complète:', error)
      setError('Erreur de connexion. Veuillez vérifier votre connexion internet.')
    } finally {
      setLoading(false)
    }
  }

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const logPasswordResetRequest = async (email) => {
    try {
      await fetch('/api/auth/log-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, timestamp: new Date().toISOString() }),
      })
    } catch (error) {
      console.error('Erreur logging:', error)
    }
  }

  const handleResend = () => {
    if (countdown === 0) {
      handleSubmit(new Event('submit'))
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link href="/" style={styles.logo}>
            <span style={styles.logoBuy}>Buy</span>
            <span style={styles.logoSell}>Sell</span>
          </Link>
          <h1 style={styles.title}>Mot de passe oublié</h1>
          <p style={styles.subtitle}>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>
              <i className="fas fa-exclamation-triangle" style={styles.errorIcon}></i>
              <div>
                <strong>Erreur</strong>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
          )}

          {message && (
            <div style={styles.successAlert}>
              <i className="fas fa-check-circle" style={styles.successIcon}></i>
              <div>
                <strong>Succès</strong>
                <div style={styles.successText}>{message}</div>
                {countdown > 0 && (
                  <div style={styles.countdown}>
                    Vous pourrez renvoyer dans {countdown} secondes
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              <i className="fas fa-envelope" style={styles.labelIcon}></i>
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                ...styles.input,
                ...(error ? styles.inputError : {}),
              }}
              placeholder="votre@email.com"
              disabled={loading || countdown > 0}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={styles.buttonsContainer}>
            <button
              type="submit"
              disabled={loading || !email || countdown > 0}
              style={{
                ...styles.submitButton,
                ...(loading || !email || countdown > 0 ? styles.submitButtonDisabled : {}),
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={styles.buttonIcon}></i>
                  Envoi en cours...
                </>
              ) : countdown > 0 ? (
                <>
                  <i className="fas fa-clock" style={styles.buttonIcon}></i>
                  Renvoyer ({countdown}s)
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" style={styles.buttonIcon}></i>
                  Envoyer le lien
                </>
              )}
            </button>

            {countdown > 0 && (
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                style={styles.resendButton}
              >
                Renvoyer le lien
              </button>
            )}
          </div>
        </form>

        <div style={styles.footer}>
          <div style={styles.footerLinks}>
            <Link href="/login" style={styles.link}>
              <i className="fas fa-arrow-left" style={styles.linkIcon}></i>
              Retour à la connexion
            </Link>
            <Link href="/contact" style={styles.helpLink}>
              <i className="fas fa-life-ring" style={styles.linkIcon}></i>
              Aide
            </Link>
          </div>
          
          <div style={styles.securityNote}>
            <i className="fas fa-shield-alt" style={styles.securityIcon}></i>
            <span>Vos données sont sécurisées et confidentielles</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    padding: '48px',
    width: '100%',
    maxWidth: '480px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    display: 'inline-block',
    fontSize: '32px',
    fontWeight: 'bold',
    textDecoration: 'none',
    marginBottom: '24px',
    background: 'linear-gradient(135deg, #000 0%, #FF6000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoBuy: {
    color: '#000',
  },
  logoSell: {
    color: '#FF6000',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #FF6000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.6',
    maxWidth: '320px',
    margin: '0 auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  labelIcon: {
    color: '#FF6000',
    fontSize: '14px',
  },
  input: {
    padding: '16px',
    border: '2px solid #e1e5e9',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    background: '#fafbfc',
    fontFamily: 'inherit',
  },
  inputError: {
    borderColor: '#dc2626',
    background: '#fef2f2',
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  submitButton: {
    background: 'linear-gradient(135deg, #FF6000, #E55A00)',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontFamily: 'inherit',
    position: 'relative',
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  resendButton: {
    background: 'transparent',
    color: '#FF6000',
    border: '2px solid #FF6000',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  link: {
    color: '#FF6000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    padding: '8px 12px',
    borderRadius: '6px',
  },
  helpLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  linkIcon: {
    fontSize: '12px',
  },
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#666',
    fontSize: '12px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  securityIcon: {
    color: '#00A650',
    fontSize: '14px',
  },
  errorAlert: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    animation: 'slideIn 0.3s ease',
  },
  errorIcon: {
    fontSize: '18px',
    marginTop: '2px',
    color: '#dc2626',
  },
  errorText: {
    marginTop: '4px',
    lineHeight: '1.4',
  },
  successAlert: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    animation: 'slideIn 0.3s ease',
  },
  successIcon: {
    fontSize: '18px',
    marginTop: '2px',
    color: '#16a34a',
  },
  successText: {
    marginTop: '4px',
    lineHeight: '1.4',
  },
  countdown: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
}

// Styles globaux inline
const globalStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .loading-pulse {
    animation: pulse 2s infinite;
  }

  @media (max-width: 640px) {
    .auth-card {
      margin: 10px;
      padding: 24px;
    }
  }
`

// Injecter les styles globaux
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = globalStyles
  document.head.appendChild(styleElement)
}
