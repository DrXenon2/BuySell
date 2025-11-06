import { NextResponse } from 'next/server';

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/products',
  '/products/[id]',
  '/category',
  '/category/[slug]',
  '/about',
  '/contact',
  '/auth/callback',
  '/api/auth',
  '/api/webhooks',
  '/_next',
  '/public'
];

// Routes qui nécessitent une authentification
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

// Routes protégées par rôle
const adminRoutes = ['/admin', '/admin/**'];
const sellerRoutes = ['/dashboard/seller', '/dashboard/seller/**'];

/**
 * Middleware pour la gestion de l'authentification et des autorisations
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  // Vérifier si la route actuelle est publique
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes('[') && route.includes(']')) {
      // Gérer les routes dynamiques
      const routePattern = new RegExp(
        '^' + route.replace(/\[.*?\]/g, '[^/]+') + '$'
      );
      return routePattern.test(pathname);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  // Si c'est une route publique, laisser passer
  if (isPublicRoute) {
    // Rediriger les utilisateurs authentifiés qui essaient d'accéder aux routes d'auth
    if (token && authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Vérifier l'authentification pour les routes protégées
  if (!token) {
    // Rediriger vers la page de login avec l'URL de retour
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier les autorisations basées sur les rôles
  if (adminRoutes.some(route => pathname.startsWith(route)) && userRole !== 'admin') {
    // Rediriger vers la page d'accès refusé ou le dashboard
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (sellerRoutes.some(route => pathname.startsWith(route)) && !['admin', 'seller'].includes(userRole)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Ajouter des en-têtes de sécurité
  const response = NextResponse.next();

  // Headers de sécurité
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Headers CSP (Content Security Policy)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.stripe.com https://*.supabase.co wss://*.supabase.co",
    "frame-src https://js.stripe.com https://*.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "block-all-mixed-content",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

// Configuration du matcher pour le middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth API routes)
     * - api/webhooks (webhook routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/webhooks).*)',
  ],
};
