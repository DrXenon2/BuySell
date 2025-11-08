// app/(auth)/forgot-password/layout.jsx
export default function ForgotPasswordLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <title>Mot de passe oublié - BuySell</title>
        <meta name="description" content="Réinitialisez votre mot de passe BuySell" />
        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html {
            font-family: 'Helvetica Neue', Arial, sans-serif;
          }
          
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            overflow-x: hidden;
          }
          
          /* Styles pour les états de focus accessibles */
          button:focus-visible,
          input:focus-visible,
          a:focus-visible {
            outline: 2px solid #FF6000;
            outline-offset: 2px;
          }
          
          /* Animation de spin pour les loaders */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .fa-spin {
            animation: spin 1s linear infinite;
          }
          
          /* Responsive design */
          @media (max-width: 480px) {
            body {
              padding: 10px;
            }
          }
          
          /* Réduire les animations si l'utilisateur le préfère */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </head>
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
