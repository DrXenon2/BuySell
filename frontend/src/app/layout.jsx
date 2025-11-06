import React from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { AppProvider } from '../contexts/AppProvider';
import { SearchProvider } from '../contexts/SearchContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import './globals.css';
import '../App.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: {
    default: 'BuySell Platform - Marketplace Moderne',
    template: '%s | BuySell Platform'
  },
  description: 'Plateforme de marketplace moderne avec système de vente entre particuliers et professionnels. Achetez et vendez en toute sécurité.',
  keywords: ['ecommerce', 'marketplace', 'vente', 'achat', 'produits', 'shopping'],
  authors: [{ name: 'BuySell Team' }],
  creator: 'BuySell Platform',
  publisher: 'BuySell Platform',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://buysell.com',
    siteName: 'BuySell Platform',
    title: 'BuySell Platform - Marketplace Moderne',
    description: 'Plateforme de marketplace moderne avec système de vente entre particuliers et professionnels',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BuySell Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuySell Platform - Marketplace Moderne',
    description: 'Plateforme de marketplace moderne avec système de vente entre particuliers et professionnels',
    creator: '@buysellplatform',
    images: ['/images/twitter-image.jpg'],
  },
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#0ea5e9',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BuySell Platform" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'BuySell Platform',
              url: 'https://buysell.com',
              logo: 'https://buysell.com/images/logo.png',
              description: 'Plateforme de marketplace moderne avec système de vente entre particuliers et professionnels',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+33-1-23-45-67-89',
                contactType: 'customer service',
                areaServed: 'FR',
                availableLanguage: ['French', 'English'],
              },
              sameAs: [
                'https://facebook.com/buysellplatform',
                'https://twitter.com/buysellplatform',
                'https://instagram.com/buysellplatform',
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <NotificationProvider>
            <AppProvider>
              <AuthProvider>
                <CartProvider>
                  <SearchProvider>
                    {children}
                  </SearchProvider>
                </CartProvider>
              </AuthProvider>
            </AppProvider>
          </NotificationProvider>
        </ThemeProvider>
        
        {/* Scripts d'analytics (optionnel) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `,
          }}
        />
      </body>
    </html>
  );
}
