/**
 * Configuration du fichier robots.txt
 */

module.exports = {
  rules: [
    {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/api',
        '/_next',
        '/static',
        '/private',
        '/checkout',
        '/profile',
        '/cart',
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
      crawlDelay: 1,
    },
    {
      userAgent: 'Bingbot',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/api',
        '/checkout',
        '/cart',
      ],
      crawlDelay: 1,
    },
  ],
  sitemap: [
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://monsite.sn'}/sitemap.xml`,
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://monsite.sn'}/sitemap-products.xml`,
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://monsite.sn'}/sitemap-categories.xml`,
  ],
  host: process.env.NEXT_PUBLIC_APP_URL || 'https://monsite.sn',
};
