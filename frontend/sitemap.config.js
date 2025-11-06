/**
 * Configuration du sitemap
 */

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://monsite.sn';

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/api',
          '/_next',
          '/static',
          '/checkout',
          '/cart',
          '/profile',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/api',
          '/checkout',
          '/cart',
        ],
      },
    ],
    additionalSitemaps: [
      `${siteUrl}/sitemap-products.xml`,
      `${siteUrl}/sitemap-categories.xml`,
      `${siteUrl}/sitemap-static.xml`,
    ],
  },
  exclude: [
    '/admin',
    '/admin/*',
    '/dashboard',
    '/dashboard/*',
    '/api',
    '/api/*',
    '/checkout',
    '/checkout/*',
    '/cart',
    '/profile',
    '/profile/*',
    '/server-sitemap.xml',
    '/404',
    '/500',
  ],
  transform: async (config, path) => {
    // Priorités par défaut
    let priority = 0.7;
    let changefreq = 'weekly';

    // Définir les priorités et fréquences en fonction des chemins
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.startsWith('/products')) {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path.startsWith('/category')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/about') || path.startsWith('/contact')) {
      priority = 0.5;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  additionalPaths: async (config) => {
    // Chemins supplémentaires pour le sitemap principal
    const result = [];

    // Pages statiques importantes
    const staticPages = [
      '/about',
      '/contact',
      '/terms',
      '/privacy',
      '/shipping',
      '/returns',
      '/faq',
    ];

    for (const page of staticPages) {
      result.push({
        loc: page,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: new Date().toISOString(),
      });
    }

    return result;
  },
  // Configuration des langues alternatives (i18n)
  alternateRefs: [
    {
      href: `${siteUrl}/fr`,
      hreflang: 'fr',
    },
    {
      href: `${siteUrl}/en`,
      hreflang: 'en',
    },
    {
      href: `${siteUrl}/ar`,
      hreflang: 'ar',
    },
  ],
};
