// frontend/src/app/(auth)/forgot-password/layout.jsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'Mot de passe oublié - BuySell Marketplace',
  description: 'Réinitialisez votre mot de passe pour accéder à votre compte BuySell. Service sécurisé et confidentiel.',
  keywords: 'mot de passe oublié, réinitialisation, compte BuySell, authentification, sécurité',
  openGraph: {
    title: 'Mot de passe oublié - BuySell',
    description: 'Réinitialisez votre mot de passe BuySell en toute sécurité',
    type: 'website',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function ForgotPasswordLayout({ children }) {
  return (
    <html lang="fr" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#FF6000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Font Awesome pour les icônes */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        
        {/* Styles globaux optimisés */}
        <style jsx global>{`
          /* Reset et base */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          *::before,
          *::after {
            box-sizing: inherit;
          }
          
          html {
            scroll-behavior: smooth;
            font-size: 16px;
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
          }
          
          body {
            font-family: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                        'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-attachment: fixed;
            min-height: 100vh;
            min-height: 100dvh;
            overflow-x: hidden;
            line-height: 1.6;
            color: #1a1a1a;
            font-synthesis: none;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Typographie responsive */
          h1, h2, h3, h4, h5, h6 {
            font-weight: 600;
            line-height: 1.3;
            margin-bottom: 0.5em;
          }
          
          p {
            margin-bottom: 1em;
          }
          
          /* Accessibilité améliorée */
          button:focus-visible,
          input:focus-visible,
          a:focus-visible,
          select:focus-visible {
            outline: 3px solid #FF6000;
            outline-offset: 2px;
            border-radius: 4px;
          }
          
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
          
          /* Animations performantes */
          @keyframes spin {
            0% { 
              transform: rotate(0deg);
            }
            100% { 
              transform: rotate(360deg);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .fa-spin {
            animation: spin 1s linear infinite;
          }
          
          .fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          
          .slide-in {
            animation: slideIn 0.3s ease-out;
          }
          
          /* États interactifs optimisés */
          input:focus {
            border-color: #FF6000 !important;
            box-shadow: 0 0 0 3px rgba(255, 96, 0, 0.1) !important;
            transform: translateY(-1px);
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 
              0 8px 25px rgba(255, 96, 0, 0.3),
              0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          button:active:not(:disabled) {
            transform: translateY(0);
            transition-duration: 0.1s;
          }
          
          a:hover {
            color: #E55A00 !important;
            transform: translateX(2px);
          }
          
          /* Styles pour les états de formulaire */
          input:disabled,
          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
          }
          
          /* Responsive design mobile-first */
          @media (max-width: 768px) {
            html {
              font-size: 15px;
            }
            
            body {
              padding: 16px;
            }
          }
          
          @media (max-width: 480px) {
            html {
              font-size: 14px;
            }
            
            body {
              padding: 12px;
            }
          }
          
          @media (max-width: 360px) {
            html {
              font-size: 13px;
            }
          }
          
          /* Support reduced motion pour l'accessibilité */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
            
            html {
              scroll-behavior: auto;
            }
          }
          
          /* Mode contraste élevé */
          @media (prefers-contrast: high) {
            .auth-card {
              border: 2px solid #000 !important;
            }
            
            button,
            input {
              border-width: 2px !important;
            }
          }
          
          /* Support dark mode */
          @media (prefers-color-scheme: dark) {
            .auth-card {
              background: #1a1a1a !important;
              color: #ffffff !important;
              border-color: #333 !important;
            }
            
            .auth-card input {
              background: #2d2d2d !important;
              color: #ffffff !important;
              border-color: #444 !important;
            }
          }
          
          /* Styles d'impression */
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            
            .auth-card {
              box-shadow: none !important;
              border: 1px solid #000 !important;
              background: white !important;
              color: black !important;
            }
            
            button,
            .no-print {
              display: none !important;
            }
          }
          
          /* Performance optimizations */
          .will-change-transform {
            will-change: transform;
          }
          
          .backface-hidden {
            backface-visibility: hidden;
          }
          
          /* Loading states */
          .loading {
            position: relative;
            overflow: hidden;
          }
          
          .loading::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.4),
              transparent
            );
            animation: shimmer 1.5s infinite;
          }
          
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
          
          /* Error states */
          .error-shake {
            animation: shake 0.5s ease-in-out;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}</style>
        
        {/* Scripts de performance et analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              if (typeof window !== 'undefined') {
                // Mesurer le temps de chargement
                window.pageLoadTime = Date.now();
                window.addEventListener('load', () => {
                  window.pageLoadTime = Date.now() - window.pageLoadTime;
                  
                  // Analytics simple
                  if (typeof gtag !== 'undefined') {
                    gtag('event', 'timing_complete', {
                      name: 'page_load',
                      value: window.pageLoadTime,
                      event_category: 'Performance'
                    });
                  }
                });
                
                // Error tracking
                window.addEventListener('error', function(e) {
                  console.error('Global error:', e.error);
                  
                  if (typeof gtag !== 'undefined') {
                    gtag('event', 'exception', {
                      description: e.error?.message || 'Unknown error',
                      fatal: false
                    });
                  }
                });
                
                // Gestion des erreurs non catchées
                window.addEventListener('unhandledrejection', function(e) {
                  console.error('Unhandled promise rejection:', e.reason);
                  
                  if (typeof gtag !== 'undefined') {
                    gtag('event', 'exception', {
                      description: 'Unhandled Promise Rejection: ' + (e.reason?.message || e.reason),
                      fatal: false
                    });
                  }
                });
                
                // Service Worker registration pour PWA
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              }
            `
          }}
        />
      </head>
      <body>
        {/* Contenu principal */}
        <main id="main-content" role="main">
          {children}
        </main>
        
        {/* Pied de page accessible */}
        <footer style={{ display: 'none' }} aria-hidden="true">
          <p>&copy; 2024 BuySell Marketplace. Tous droits réservés.</p>
        </footer>
        
        {/* Scripts de chargement différé */}
        <script
          defer
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"
          integrity="sha512-fD9DI5bZwQxOi7MhYWnnNPlvXdp/2Pj3XSTRrFs5FQa4mizyGLnJcN6tuvUS6LbmgN1ut+XGSABKvjN0H6Aoow=="
          crossOrigin="anonymous"
        ></script>
      </body>
    </html>
  )
}
