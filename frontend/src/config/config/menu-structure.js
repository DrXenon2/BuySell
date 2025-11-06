/**
 * Structure du menu de navigation Buysell
 * Optimisé pour l'UX et la découverte des catégories
 */

import { CATEGORIES_CONFIG } from './categories';

export const MAIN_NAVIGATION = {
  // Menu principal
  primary: [
    {
      id: 'home',
      name: 'Accueil',
      href: '/',
      icon: '🏠',
      type: 'link',
      priority: 1
    },
    {
      id: 'official-stores',
      name: 'Boutiques Officielles',
      href: '/boutiques-officielles',
      icon: '🏪',
      type: 'mega',
      priority: 2,
      featured: true,
      categories: CATEGORIES_CONFIG.OFFICIAL_STORES.subcategories
    },
    {
      id: 'djassa',
      name: 'Djassa',
      href: '/djassa',
      icon: '🔄',
      type: 'mega',
      priority: 3,
      featured: true,
      badge: 'Seconde main',
      categories: CATEGORIES_CONFIG.DJASSA.subcategories
    },
    {
      id: 'sports',
      name: 'Articles de Sport',
      href: '/articles-sport',
      icon: '⚽',
      type: 'dropdown',
      priority: 4,
      categories: CATEGORIES_CONFIG.SPORTS.subcategories
    },
    {
      id: 'auto-moto',
      name: 'Auto & Moto',
      href: '/auto-moto',
      icon: '🚗',
      type: 'dropdown',
      priority: 5,
      categories: CATEGORIES_CONFIG.AUTO_MOTO.subcategories
    },
    {
      id: 'fashion',
      name: 'Mode',
      href: '/mode',
      icon: '👗',
      type: 'mega',
      priority: 6,
      featured: true,
      categories: CATEGORIES_CONFIG.FASHION.subcategories
    },
    {
      id: 'supermarket',
      name: 'Supermarche',
      href: '/supermarche',
      icon: '🛒',
      type: 'mega',
      priority: 7,
      featured: true,
      categories: CATEGORIES_CONFIG.SUPERMARKET.subcategories
    },
    {
      id: 'home-office',
      name: 'Maison & Bureau',
      href: '/maison-bureau',
      icon: '🏠',
      type: 'dropdown',
      priority: 8,
      categories: CATEGORIES_CONFIG.HOME_OFFICE.subcategories
    },
    {
      id: 'more',
      name: 'Plus',
      href: '#',
      icon: '📦',
      type: 'dropdown',
      priority: 9,
      categories: CATEGORIES_CONFIG.OTHER_CATEGORIES.subcategories
    }
  ],

  // Menu utilisateur (header droite)
  userMenu: [
    {
      id: 'account',
      name: 'Mon Compte',
      href: '/profile',
      icon: '👤',
      type: 'dropdown',
      auth: true,
      items: [
        {
          id: 'profile',
          name: 'Mon Profil',
          href: '/profile',
          icon: '👤'
        },
        {
          id: 'orders',
          name: 'Mes Commandes',
          href: '/profile/orders',
          icon: '📦'
        },
        {
          id: 'wishlist',
          name: 'Mes Favoris',
          href: '/profile/wishlist',
          icon: '❤️'
        },
        {
          id: 'addresses',
          name: 'Mes Adresses',
          href: '/profile/addresses',
          icon: '🏠'
        },
        {
          id: 'settings',
          name: 'Paramètres',
          href: '/profile/settings',
          icon: '⚙️'
        },
        {
          id: 'logout',
          name: 'Déconnexion',
          href: '/logout',
          icon: '🚪',
          type: 'action'
        }
      ]
    },
    {
      id: 'favorites',
      name: 'Favoris',
      href: '/profile/wishlist',
      icon: '❤️',
      type: 'link',
      badge: true,
      auth: true
    },
    {
      id: 'cart',
      name: 'Panier',
      href: '/cart',
      icon: '🛒',
      type: 'link',
      badge: true
    }
  ],

  // Menu vendeur
  sellerMenu: [
    {
      id: 'seller-dashboard',
      name: 'Tableau de Bord',
      href: '/dashboard/seller',
      icon: '📊',
      role: 'seller'
    },
    {
      id: 'seller-products',
      name: 'Mes Produits',
      href: '/dashboard/seller/products',
      icon: '📦',
      role: 'seller'
    },
    {
      id: 'seller-orders',
      name: 'Commandes',
      href: '/dashboard/seller/orders',
      icon: '📋',
      role: 'seller'
    },
    {
      id: 'seller-analytics',
      name: 'Analytics',
      href: '/dashboard/seller/analytics',
      icon: '📈',
      role: 'seller'
    }
  ],

  // Menu admin
  adminMenu: [
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      href: '/dashboard/admin',
      icon: '🛡️',
      role: 'admin'
    },
    {
      id: 'admin-users',
      name: 'Utilisateurs',
      href: '/dashboard/admin/users',
      icon: '👥',
      role: 'admin'
    },
    {
      id: 'admin-products',
      name: 'Produits',
      href: '/dashboard/admin/products',
      icon: '📦',
      role: 'admin'
    },
    {
      id: 'admin-orders',
      name: 'Commandes',
      href: '/dashboard/admin/orders',
      icon: '📋',
      role: 'admin'
    },
    {
      id: 'admin-categories',
      name: 'Catégories',
      href: '/dashboard/admin/categories',
      icon: '📁',
      role: 'admin'
    },
    {
      id: 'admin-analytics',
      name: 'Analytics',
      href: '/dashboard/admin/analytics',
      icon: '📊',
      role: 'admin'
    }
  ],

  // Footer menu
  footer: {
    help: [
      {
        id: 'help-chat',
        name: 'Discuter avec nous',
        href: '/help/chat',
        icon: '💬'
      },
      {
        id: 'help-faq',
        name: 'Aide & FAQ',
        href: '/help/faq',
        icon: '❓'
      },
      {
        id: 'help-contact',
        name: 'Contactez-nous',
        href: '/help/contact',
        icon: '📞'
      }
    ],
    usefulLinks: [
      {
        id: 'track-order',
        name: 'Suivre sa commande',
        href: '/track-order',
        icon: '📦'
      },
      {
        id: 'shipping-delivery',
        name: 'Expédition et livraison',
        href: '/shipping-delivery',
        icon: '🚚'
      },
      {
        id: 'return-policy',
        name: 'Politique de retour',
        href: '/return-policy',
        icon: '🔄'
      },
      {
        id: 'how-to-order',
        name: 'Comment commander?',
        href: '/how-to-order',
        icon: '🛒'
      },
      {
        id: 'pickup-points',
        name: 'Points relais Buysell',
        href: '/pickup-points',
        icon: '📍'
      }
    ],
    about: [
      {
        id: 'about-us',
        name: 'Qui sommes-nous',
        href: '/about',
        icon: '🏢'
      },
      {
        id: 'careers',
        name: 'Carrières chez Buysell',
        href: '/careers',
        icon: '💼'
      },
      {
        id: 'terms',
        name: 'Conditions Générales',
        href: '/terms',
        icon: '📄'
      },
      {
        id: 'buysell-express',
        name: 'Buysell Express',
        href: '/express',
        icon: '⚡'
      },
      {
        id: 'all-stores',
        name: 'Toutes les boutiques officielles',
        href: '/boutiques-officielles',
        icon: '🏪'
      },
      {
        id: 'flash-sales',
        name: 'Ventes Flash',
        href: '/flash-sales',
        icon: '🔥'
      }
    ],
    earnMoney: [
      {
        id: 'sell-on-buysell',
        name: 'Vendre sur Buysell',
        href: '/sell',
        icon: '💰'
      },
      {
        id: 'seller-space',
        name: 'Espace vendeur',
        href: '/dashboard/seller',
        icon: '🏪'
      },
      {
        id: 'become-consultant',
        name: 'Devenez Consultant Buysell',
        href: '/become-consultant',
        icon: '👔'
      },
      {
        id: 'logistics-partner',
        name: 'Devenez partenaire logistique',
        href: '/logistics-partner',
        icon: '🚚'
      }
    ]
  }
};

// Helper functions
export const getMainNavigation = () => {
  return MAIN_NAVIGATION.primary.sort((a, b) => a.priority - b.priority);
};

export const getUserNavigation = (isAuthenticated, userRole) => {
  const baseMenu = MAIN_NAVIGATION.userMenu.filter(item => !item.auth || isAuthenticated);
  
  if (isAuthenticated) {
    if (userRole === 'seller') {
      return [...baseMenu, ...MAIN_NAVIGATION.sellerMenu];
    } else if (userRole === 'admin') {
      return [...baseMenu, ...MAIN_NAVIGATION.adminMenu];
    }
  }
  
  return baseMenu;
};

export const getFooterNavigation = () => {
  return MAIN_NAVIGATION.footer;
};

export const getMegaMenuCategories = () => {
  return MAIN_NAVIGATION.primary.filter(item => item.type === 'mega');
};

export const getFeaturedMenuItems = () => {
  return MAIN_NAVIGATION.primary.filter(item => item.featured);
};

export const getNavigationItemById = (id) => {
  // Search in primary navigation
  let item = MAIN_NAVIGATION.primary.find(item => item.id === id);
  if (item) return item;
  
  // Search in user menu
  item = MAIN_NAVIGATION.userMenu.find(item => item.id === id);
  if (item) return item;
  
  // Search in seller menu
  item = MAIN_NAVIGATION.sellerMenu.find(item => item.id === id);
  if (item) return item;
  
  // Search in admin menu
  item = MAIN_NAVIGATION.adminMenu.find(item => item.id === id);
  if (item) return item;
  
  return null;
};

export const getBreadcrumbPath = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Accueil', href: '/' }];
  
  let currentPath = '';
  paths.forEach(path => {
    currentPath += `/${path}`;
    const navItem = Object.values(MAIN_NAVIGATION)
      .flat()
      .find(item => item.href === currentPath);
    
    if (navItem) {
      breadcrumbs.push({
        name: navItem.name,
        href: currentPath
      });
    } else {
      // For dynamic routes, you might want to fetch the actual name
      breadcrumbs.push({
        name: path.charAt(0).toUpperCase() + path.slice(1),
        href: currentPath
      });
    }
  });
  
  return breadcrumbs;
};

export const isActiveRoute = (currentPath, menuHref) => {
  if (menuHref === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(menuHref);
};

export default MAIN_NAVIGATION;
