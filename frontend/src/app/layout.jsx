import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Buysell - Achetez. Vendez. Revendez. Simplifiez.',
  description: 'Marketplace complète neuf & occasion - #1 en Afrique',
  keywords: 'achat, vente, occasion, neuf, marketplace, Afrique, Côte d\'Ivoire, Sénégal, Cameroun',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          :root {
            --orange: #FF6000;
            --orange-dark: #E55A00;
            --black: #000000;
            --dark: #1A1A1A;
            --gray-dark: #333333;
            --gray: #666666;
            --gray-light: #999999;
            --gray-lighter: #CCCCCC;
            --white: #FFFFFF;
            --green: #00A650;
            --blue: #0677E8;
            --red: #FF0000;
            --yellow: #FFD700;
            
            --shadow: 0 2px 8px rgba(0,0,0,0.1);
            --shadow-hover: 0 4px 16px rgba(0,0,0,0.15);
            --radius: 8px;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #F5F5F5;
            color: var(--dark);
            line-height: 1.4;
          }

          a {
            text-decoration: none;
            color: inherit;
          }

          button {
            cursor: pointer;
            border: none;
            font-family: inherit;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
          }

          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }

          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }

          @media (max-width: 768px) {
            .container {
              padding: 0 10px;
            }
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
