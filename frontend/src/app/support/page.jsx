'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState('general')
  const [searchTerm, setSearchTerm] = useState('')

  const faqCategories = {
    general: {
      title: '❓ Général',
      questions: [
        {
          question: 'Comment créer un compte sur Buysell ?',
          answer: 'Cliquez sur "Créer un compte" en haut à droite, remplissez le formulaire avec vos informations et validez votre email. C\'est gratuit et rapide !'
        },
        {
          question: 'Buysell est-il disponible dans mon pays ?',
          answer: 'Buysell est disponible en Côte d\'Ivoire, Sénégal, Cameroun, Ghana et bientôt dans d\'autres pays d\'Afrique. La livraison est offerte à partir de 50 000 FCFA.'
        },
        {
          question: 'Quels sont les frais de service ?',
          answer: 'L\'inscription et la navigation sont totalement gratuites. Des frais de commission s\'appliquent uniquement sur les ventes réalisées.'
        }
      ]
    },
    payment: {
      title: '💳 Paiement',
      questions: [
        {
          question: 'Quels moyens de paiement acceptez-vous ?',
          answer: 'Nous acceptons : Mobile Money (Orange Money, MTN Money, Wave), cartes bancaires (Visa, Mastercard), paiement à la livraison et virement bancaire.'
        },
        {
          question: 'Mes paiements sont-ils sécurisés ?',
          answer: 'Oui ! Tous les paiements sont cryptés SSL et conformes aux normes PCI DSS. Nous ne stockons jamais vos informations bancaires.'
        },
        {
          question: 'Comment fonctionne le paiement à la livraison ?',
          answer: 'Vous payez en espèces lors de la réception de votre colis. Le montant exact vous sera communiqué avant la livraison.'
        }
      ]
    },
    delivery: {
      title: '🚚 Livraison',
      questions: [
        {
          question: 'Quels sont les délais de livraison ?',
          answer: 'Abidjan : 24-48h • Dakar : 2-3 jours • Douala : 3-4 jours • Autres villes : 4-7 jours ouvrés. Livraison express disponible.'
        },
        {
          question: 'Puis-je suivre ma commande ?',
          answer: 'Oui ! Vous recevrez un numéro de suivi par SMS/email. Suivez votre colis en temps réel dans votre espace client.'
        },
        {
          question: 'Livrez-vous dans les zones rurales ?',
          answer: 'Oui, nous livrons partout ! Les délais peuvent être légèrement plus longs selon l\'accessibilité de votre localité.'
        }
      ]
    },
    returns: {
      title: '↩️ Retours & Remboursements',
      questions: [
        {
          question: 'Quelle est votre politique de retour ?',
          answer: '30 jours satisfait ou remboursé ! Retours gratuits pour les articles neufs dans leur emballage d\'origine.'
        },
        {
          question: 'Comment initier un retour ?',
          answer: 'Rendez-vous dans "Mes commandes", sélectionnez l\'article et cliquez sur "Retourner". Suivez les instructions simples.'
        },
        {
          question: 'Combien de temps pour être remboursé ?',
          answer: 'Les remboursements sont traités sous 3-5 jours ouvrés après réception de l\'article dans nos entrepôts.'
        }
      ]
    },
    selling: {
      title: '🏪 Vendre sur Buysell',
      questions: [
        {
          question: 'Comment devenir vendeur ?',
          answer: 'Créez un compte, complétez votre profil vendeur et soumettez vos documents. Notre équipe valide sous 24h.'
        },
        {
          question: 'Quelles sont les commissions ?',
          answer: 'Commission de 5% à 15% selon la catégorie. Pas de frais fixes, vous payez uniquement quand vous vendez !'
        },
        {
          question: 'Comment sont gérés les stocks ?',
          answer: 'Notre dashboard intuitif vous permet de gérer stocks, prix et promotions en temps réel. Alertes automatiques.'
        }
      ]
    }
  }

  const filteredFAQs = Object.entries(faqCategories)
    .filter(([category]) => category === activeCategory)
    .flatMap(([_, categoryData]) => 
      categoryData.questions.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '20px 15px' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: 'var(--dark)'
          }}>
            💬 Centre d'Aide
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '16px', marginBottom: '30px' }}>
            Nous sommes là pour vous aider ! Trouvez rapidement des réponses à vos questions.
          </p>

          {/* Barre de recherche */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: 'flex',
            background: 'var(--white)',
            border: '2px solid var(--orange)',
            borderRadius: '25px',
            overflow: 'hidden'
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une question..."
              style={{
                flex: 1,
                padding: '15px 20px',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                background: 'transparent'
              }}
            />
            <button style={{
              background: 'var(--orange)',
              color: 'var(--white)',
              padding: '15px 25px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '280px 1fr', 
          gap: '30px'
        }}>
          {/* Navigation des catégories */}
          <div>
            <nav style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '20px',
                color: 'var(--dark)'
              }}>
                Catégories d'aide
              </h3>
              <ul style={{ listStyle: 'none' }}>
                {Object.entries(faqCategories).map(([key, category]) => (
                  <li key={key} style={{ marginBottom: '10px' }}>
                    <button
                      onClick={() => setActiveCategory(key)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: activeCategory === key ? 'var(--orange)' : 'transparent',
                        color: activeCategory === key ? 'var(--white)' : 'var(--dark)',
                        border: 'none',
                        padding: '12px 15px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {category.title}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Contact rapide */}
              <div style={{ 
                borderTop: '1px solid var(--gray-lighter)', 
                marginTop: '20px', 
                paddingTop: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                  📞 Contact direct
                </h4>
                <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '10px' }}>
                  <i className="fas fa-phone" style={{ marginRight: '8px' }}></i>
                  +225 07 07 07 07 07
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '15px' }}>
                  <i className="fas fa-envelope" style={{ marginRight: '8px' }}></i>
                  support@buysell.ci
                </div>
                <Link href="/support/contact" style={{
                  display: 'block',
                  background: 'var(--orange)',
                  color: 'var(--white)',
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textDecoration: 'none'
                }}>
                  Formulaire de contact
                </Link>
              </div>
            </nav>
          </div>

          {/* Contenu des FAQs */}
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                marginBottom: '10px',
                color: 'var(--dark)'
              }}>
                {faqCategories[activeCategory]?.title}
              </h2>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                {filteredFAQs.length} question{filteredFAQs.length > 1 ? 's' : ''} trouvée{filteredFAQs.length > 1 ? 's' : ''}
              </p>
            </div>

            {filteredFAQs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredFAQs.map((faq, index) => (
                  <div key={index} style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--gray-lighter)'
                  }}>
                    <div style={{
                      padding: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={(e) => {
                      const content = e.currentTarget.nextElementSibling
                      content.style.display = content.style.display === 'none' ? 'block' : 'none'
                    }}
                    >
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '500',
                        margin: 0
                      }}>
                        {faq.question}
                      </h3>
                      <i className="fas fa-chevron-down"></i>
                    </div>
                    <div style={{
                      padding: '0 20px 20px',
                      display: 'block'
                    }}>
                      <p style={{ 
                        color: 'var(--gray)', 
                        lineHeight: 1.6,
                        margin: 0
                      }}>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: 'var(--gray)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>
                  Aucune question trouvée
                </h3>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                  Essayez d'autres mots-clés ou parcourez les différentes catégories
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'var(--orange)',
                    color: 'var(--white)',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Effacer la recherche
                </button>
              </div>
            )}

            {/* Section contact */}
            <div style={{
              background: 'linear-gradient(135deg, var(--orange), #FF8C00)',
              color: 'var(--white)',
              padding: '30px',
              borderRadius: '12px',
              marginTop: '40px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                Vous n'avez pas trouvé de réponse ?
              </h3>
              <p style={{ marginBottom: '20px', opacity: 0.9 }}>
                Notre équipe support est disponible 24h/24 et 7j/7 pour vous aider
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/support/contact" style={{
                  background: 'var(--white)',
                  color: 'var(--orange)',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textDecoration: 'none'
                }}>
                  📧 Contact par email
                </Link>
                <button style={{
                  background: 'transparent',
                  color: 'var(--white)',
                  border: '2px solid var(--white)',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  💬 Chat en direct
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
