// app/(auth)/forgot-password/page.jsx
'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Un lien de réinitialisation a été envoyé à votre adresse email.')
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
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
              <i className="fas fa-exclamation-circle" style={styles.errorIcon}></i>
              {error}
            </div>
          )}

          {message && (
            <div style={styles.successAlert}>
              <i className="fas fa-check-circle" style={styles.successIcon}></i>
              {message}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="votre@email.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            style={{
              ...styles.submitButton,
              ...(loading || !email ? styles.submitButtonDisabled : {}),
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={styles.buttonIcon}></i>
                Envoi en cours...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane" style={styles.buttonIcon}></i>
                Envoyer le lien
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <Link href="/login" style={styles.link}>
            <i className="fas fa-arrow-left" style={styles.linkIcon}></i>
            Retour à la connexion
          </Link>
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
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    display: 'inline-block',
    fontSize: '28px',
    fontWeight: 'bold',
    textDecoration: 'none',
    marginBottom: '20px',
  },
  logoBuy: {
    color: '#000',
  },
  logoSell: {
    color: '#FF6000',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  inputFocus: {
    borderColor: '#FF6000',
    boxShadow: '0 0 0 3px rgba(255, 96, 0, 0.1)',
  },
  submitButton: {
    background: 'linear-gradient(135deg, #FF6000, #E55A00)',
    color: 'white',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  submitButtonHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(255, 96, 0, 0.3)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  buttonIcon: {
    fontSize: '14px',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
  },
  link: {
    color: '#FF6000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'color 0.2s ease',
  },
  linkHover: {
    color: '#E55A00',
  },
  linkIcon: {
    fontSize: '12px',
  },
  errorAlert: {
    background: '#fee',
    border: '1px solid #fcc',
    color: '#c33',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  successAlert: {
    background: '#efe',
    border: '1px solid #cfc',
    color: '#363',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  successIcon: {
    fontSize: '16px',
  },
}

// Ajout des styles hover dynamiques
if (typeof window !== 'undefined') {
  const styleSheet = document.styleSheets[0]
  
  // Hover pour le bouton submit
  styleSheet.insertRule(`
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 96, 0, 0.3);
    }
  `)
  
  // Hover pour les liens
  styleSheet.insertRule(`
    a:hover {
      color: #E55A00;
    }
  `)
  
  // Focus pour les inputs
  styleSheet.insertRule(`
    input:focus {
      border-color: #FF6000;
      box-shadow: 0 0 0 3px rgba(255, 96, 0, 0.1);
    }
  `)
}
