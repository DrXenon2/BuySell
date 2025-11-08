// app/(auth)/reset-password/page.jsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    checkPasswordStrength(password)
  }, [password])

  const checkSession = async () => {
    try {
      const { session } = await auth.getSession()
      if (!session) {
        // Rediriger vers login si pas de session
        router.push('/login?redirect=reset-password')
      }
    } catch (error) {
      console.error('Erreur vérification session:', error)
      setError('Session invalide. Veuillez redemander un lien de réinitialisation.')
    }
  }

  const checkPasswordStrength = (pwd) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++
    if (pwd.match(/\d/)) strength++
    if (pwd.match(/[^a-zA-Z\d]/)) strength++
    setPasswordStrength(strength)
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: case 1: return '#dc2626' // Rouge
      case 2: return '#f59e0b' // Orange
      case 3: return '#84cc16' // Vert clair
      case 4: return '#16a34a' // Vert
      default: return '#6b7280'
    }
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'Très faible'
      case 1: return 'Faible'
      case 2: return 'Moyen'
      case 3: return 'Fort'
      case 4: return 'Très fort'
      default: return ''
    }
  }

  const validateForm = () => {
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }
    if (passwordStrength < 2) {
      setError('Le mot de passe est trop faible')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      // Mettre à jour le mot de passe avec Supabase Auth
      await auth.updatePassword(password)

      setMessage('Votre mot de passe a été réinitialisé avec succès!')
      
      // Logger la réinitialisation
      await logPasswordReset()
      
      // Redirection après succès
      setTimeout(() => {
        router.push('/login?message=password_reset_success')
      }, 3000)

    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthError = (error) => {
    const errorMessage = error.message.toLowerCase()
    
    if (errorMessage.includes('session') || errorMessage.includes('expired')) {
      setError('Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.')
    } else if (errorMessage.includes('weak')) {
      setError('Le mot de passe est trop faible. Utilisez au moins 8 caractères avec des lettres, chiffres et symboles.')
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      setError('Erreur de connexion. Veuillez vérifier votre connexion internet.')
    } else {
      setError('Erreur lors de la réinitialisation. Veuillez réessayer.')
    }
  }

  const logPasswordReset = async () => {
    try {
      await fetch('/api/auth/log-password-reset-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          action: 'password_reset_success'
        }),
      })
    } catch (error) {
      console.error('Erreur logging:', error)
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
          <h1 style={styles.title}>Nouveau mot de passe</h1>
          <p style={styles.subtitle}>
            Créez un nouveau mot de passe sécurisé pour votre compte
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
                <div style={styles.redirectText}>
                  Redirection vers la page de connexion...
                </div>
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              <i className="fas fa-lock" style={styles.labelIcon}></i>
              Nouveau mot de passe
            </label>
            <div style={styles.passwordInputContainer}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Votre nouveau mot de passe"
                disabled={loading}
                autoComplete="new-password"
                minLength="8"
              />
              <button
                type="button"
                style={styles.toggleButton}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            
            {password && (
              <div style={styles.passwordStrength}>
                <div style={styles.strengthBarContainer}>
                  <div 
                    style={{
                      ...styles.strengthBar,
                      width: `${(passwordStrength / 4) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  ></div>
                </div>
                <div style={styles.strengthText}>
                  Force: <span style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              <i className="fas fa-lock" style={styles.labelIcon}></i>
              Confirmer le mot de passe
            </label>
            <div style={styles.passwordInputContainer}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  ...styles.input,
                  ...(confirmPassword && password !== confirmPassword ? styles.inputError : {}),
                }}
                placeholder="Confirmez votre mot de passe"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                style={styles.toggleButton}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <div style={styles.errorText}>
                <i className="fas fa-exclamation-circle" style={styles.smallErrorIcon}></i>
                Les mots de passe ne correspondent pas
              </div>
            )}
          </div>

          <div style={styles.passwordRequirements}>
            <h4 style={styles.requirementsTitle}>Exigences de sécurité :</h4>
            <ul style={styles.requirementsList}>
              <li style={{...styles.requirementItem, ...(password.length >= 8 ? styles.requirementMet : {})}}>
                <i className={`fas ${password.length >= 8 ? 'fa-check' : 'fa-times'}`}></i>
                Au moins 8 caractères
              </li>
              <li style={{...styles.requirementItem, ...(password.match(/[a-z]/) && password.match(/[A-Z]/) ? styles.requirementMet : {})}}>
                <i className={`fas ${password.match(/[a-z]/) && password.match(/[A-Z]/) ? 'fa-check' : 'fa-times'}`}></i>
                Lettres majuscules et minuscules
              </li>
              <li style={{...styles.requirementItem, ...(password.match(/\d/) ? styles.requirementMet : {})}}>
                <i className={`fas ${password.match(/\d/) ? 'fa-check' : 'fa-times'}`}></i>
                Au moins un chiffre
              </li>
              <li style={{...styles.requirementItem, ...(password.match(/[^a-zA-Z\d]/) ? styles.requirementMet : {})}}>
                <i className={`fas ${password.match(/[^a-zA-Z\d]/) ? 'fa-check' : 'fa-times'}`}></i>
                Au moins un caractère spécial
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            style={{
              ...styles.submitButton,
              ...(loading || !password || !confirmPassword || password !== confirmPassword ? styles.submitButtonDisabled : {}),
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={styles.buttonIcon}></i>
                Réinitialisation...
              </>
            ) : (
              <>
                <i className="fas fa-key" style={styles.buttonIcon}></i>
                Réinitialiser le mot de passe
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <div style={styles.footerLinks}>
            <Link href="/login" style={styles.link}>
              <i className="fas fa-arrow-left" style={styles.linkIcon}></i>
              Retour à la connexion
            </Link>
            <Link href="/forgot-password" style={styles.helpLink}>
              <i className="fas fa-redo" style={styles.linkIcon}></i>
              Demander un nouveau lien
            </Link>
          </div>
          
          <div style={styles.securityNote}>
            <i className="fas fa-shield-alt" style={styles.securityIcon}></i>
            <span>Votre mot de passe est chiffré et sécurisé</span>
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
  passwordInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
    width: '100%',
    paddingRight: '50px',
  },
  inputError: {
    borderColor: '#dc2626',
    background: '#fef2f2',
  },
  toggleButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  passwordStrength: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  strengthBarContainer: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'all 0.3s ease',
  },
  strengthText: {
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    justifyContent: 'space-between',
  },
  passwordRequirements: {
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
  },
  requirementsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  requirementsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  requirementItem: {
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'color 0.3s ease',
  },
  requirementMet: {
    color: '#16a34a',
    fontWeight: '500',
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
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
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
  },
  errorIcon: {
    fontSize: '18px',
    marginTop: '2px',
    color: '#dc2626',
  },
  smallErrorIcon: {
    fontSize: '14px',
    marginRight: '6px',
  },
  errorText: {
    marginTop: '4px',
    lineHeight: '1.4',
    fontSize: '12px',
    color: '#dc2626',
    display: 'flex',
    alignItems: 'center',
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
  redirectText: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
}
