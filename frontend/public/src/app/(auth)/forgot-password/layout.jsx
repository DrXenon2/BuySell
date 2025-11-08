// app/(auth)/forgot-password/layout.jsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'Mot de passe oublié - BuySell Marketplace',
  description: 'Réinitialisez votre mot de passe pour accéder à votre compte BuySell',
  keywords: 'mot de passe oublié, réinitialisation, compte, authentification',
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html {
            scroll-behavior: smooth;
          }
          
          body {
            font-family: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            overflow-x: hidden;
            line-height: 1.6;
            color: #1a1a1a;
          }
          
          /* Accessibilité */
          button:focus-visible,
          input:focus-visible,
          a:focus-visible {
            outline: 3px solid #FF6000;
            outline-offset: 2px;
            border-radius: 4px;
          }
          
          /* Animations */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .fa-spin {
            animation: spin 1s linear infinite;
          }
          
          /* États interactifs */
          input:focus {
            border-color: #FF6000 !important;
            box-shadow: 0 0 0 3px rgba(255, 96, 0, 0.1) !important;
            transform: translateY(-1px);
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 96, 0, 0.3);
          }
          
          button:active:not(:disabled) {
            transform: translateY(0);
          }
          
          a:hover {
            color: #E55A00 !important;
            transform: translateX(2px);
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            body {
              padding: 16px;
            }
          }
          
          @media (max-width: 480px) {
            body {
              padding: 12px;
            }
          }
          
          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
            
            html {
              scroll-behavior: auto;
            }
          }
          
          /* High contrast mode */
          @media (prefers-contrast: high) {
            .auth-card {
              border: 2px solid #000;
            }
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .auth-card {
              background: #1a1a1a;
              color: #fff;
            }
          }
          
          /* Impression */
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            
            .auth-card {
              box-shadow: none !important;
              border: 1px solid #000 !important;
            }
          }
        `}</style>
      </head>
      <body>
        <div id="root">
          {children}
        </div>
        
        {/* Scripts de analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Analytics simple
              if (typeof window !== 'undefined') {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-XXXXXXXXXX');
                
                // Tracking des pages
                gtag('event', 'page_view', {
                  page_title: 'Forgot Password',
                  page_location: window.location.href
                });
              }
              
              // Error tracking
              window.addEventListener('error', function(e) {
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'exception', {
                    description: e.error.message,
                    fatal: false
                  });
                }
              });
            `
          }}
        />
      </body>
    </html>
  )
}
