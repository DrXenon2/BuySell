/**
 * Configuration complète des catégories Buysell
 * Structure optimisée pour l'achat, vente et revente
 */

export const CATEGORIES_CONFIG = {
  // ==================== BOUTIQUES OFFICIELLES ====================
  OFFICIAL_STORES: {
    id: 'official-stores',
    name: 'Boutiques Officielles',
    slug: 'boutiques-officielles',
    description: 'Produits neufs garantis des marques officielles',
    image: '/images/categories/official-stores.jpg',
    icon: '🏪',
    color: 'bg-blue-500',
    featured: true,
    subcategories: [
      {
        id: 'phones-tablets',
        name: 'Téléphones & Tablettes',
        slug: 'telephones-tablettes',
        image: '/images/categories/phones-tablets.jpg',
        brands: ['Apple', 'Samsung', 'Xiaomi', 'Tecno', 'Infinix', 'Oppo', 'Vivo', 'Huawei'],
        filters: ['Marque', 'RAM', 'Stockage', 'Prix', 'Écran', 'Appareil photo']
      },
      {
        id: 'tv-electronics',
        name: 'TV & Electronique',
        slug: 'tv-electronique',
        image: '/images/categories/tv-electronics.jpg',
        brands: ['Samsung', 'LG', 'Sony', 'TCL', 'Panasonic', 'Philips'],
        filters: ['Type', 'Taille', 'Résolution', 'Smart TV', 'Prix']
      },
      {
        id: 'home-appliances',
        name: 'Électroménager',
        slug: 'electromenager',
        image: '/images/categories/home-appliances.jpg',
        brands: ['LG', 'Samsung', 'Whirlpool', 'Brandt', 'Teka'],
        filters: ['Type', 'Capacité', 'Énergie', 'Couleur', 'Prix']
      },
      {
        id: 'home-office',
        name: 'Maison et bureau',
        slug: 'maison-bureau',
        image: '/images/categories/home-office.jpg',
        brands: ['IKEA', 'Mobilux', 'Kartell', 'Herman Miller'],
        filters: ['Type', 'Matériau', 'Couleur', 'Style', 'Prix']
      },
      {
        id: 'computers',
        name: 'Informatique',
        slug: 'informatique',
        image: '/images/categories/computers.jpg',
        brands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer'],
        filters: ['Type', 'Processeur', 'RAM', 'Stockage', 'Écran', 'Prix']
      },
      {
        id: 'fashion',
        name: 'Mode',
        slug: 'mode',
        image: '/images/categories/fashion.jpg',
        brands: ['Zara', 'H&M', 'Nike', 'Adidas', 'Louis Vuitton'],
        filters: ['Genre', 'Taille', 'Couleur', 'Marque', 'Prix']
      },
      {
        id: 'supermarket',
        name: 'Supermarche',
        slug: 'supermarche',
        image: '/images/categories/supermarket.jpg',
        brands: ['Nestlé', 'Coca-Cola', 'Unilever', 'Pampers', 'Milupa'],
        filters: ['Catégorie', 'Marque', 'Prix', 'Promotions']
      },
      {
        id: 'beauty-hygiene',
        name: 'Beauté & Hygiène',
        slug: 'beaute-hygiene',
        image: '/images/categories/beauty-hygiene.jpg',
        brands: ["L'Oréal", 'Nivea', 'Dove', 'Garnier', 'Maybelline'],
        filters: ['Type', 'Marque', 'Peau', 'Prix']
      },
      {
        id: 'baby-products',
        name: 'Produits pour bébés',
        slug: 'produits-bebes',
        image: '/images/categories/baby-products.jpg',
        brands: ['Pampers', 'Nestlé', 'Chicco', 'Fisher-Price', 'Mustela'],
        filters: ['Âge', 'Type', 'Marque', 'Prix']
      },
      {
        id: 'agriculture-livestock',
        name: 'Agriculture & Élevage',
        slug: 'agriculture-elevage',
        image: '/images/categories/agriculture.jpg',
        brands: ['John Deere', 'Massey Ferguson', 'Bayer', 'Syngenta'],
        filters: ['Type', 'Usage', 'Marque', 'Prix']
      }
    ]
  },

  // ==================== DJASSA (SECONDE MAIN) ====================
  DJASSA: {
    id: 'djassa',
    name: 'Djassa',
    slug: 'djassa',
    description: 'Articles de seconde main de qualité - Bonnes affaires garanties',
    image: '/images/categories/second-hand.jpg',
    icon: '🔄',
    color: 'bg-green-500',
    featured: true,
    isSecondHand: true,
    subcategories: [
      {
        id: 'clothing-accessories',
        name: 'Vêtements & Accessoires',
        slug: 'vetements-accessoires',
        image: '/images/categories/secondhand-clothing.jpg',
        types: ['Homme', 'Femme', 'Enfant', 'Luxe', 'Sport'],
        filters: ['Genre', 'Taille', 'État', 'Marque', 'Prix']
      },
      {
        id: 'electronics-used',
        name: 'Électronique',
        slug: 'electronique-occasion',
        image: '/images/categories/secondhand-electronics.jpg',
        types: ['Téléphones', 'Ordinateurs', 'Audio', 'Gaming', 'Photo'],
        filters: ['Type', 'Marque', 'État', 'Garantie', 'Prix']
      },
      {
        id: 'home-decor-used',
        name: 'Maison & Déco',
        slug: 'maison-deco-occasion',
        image: '/images/categories/secondhand-home.jpg',
        types: ['Meubles', 'Décoration', 'Électroménager', 'Luminaire'],
        filters: ['Type', 'État', 'Style', 'Matériau', 'Prix']
      },
      {
        id: 'hobbies-culture-used',
        name: 'Loisirs & Culture',
        slug: 'loisirs-culture-occasion',
        image: '/images/categories/secondhand-hobbies.jpg',
        types: ['Livres', 'Jeux', 'Instruments', 'Sports', 'Collections'],
        filters: ['Type', 'État', 'Complet', 'Prix']
      },
      {
        id: 'auto-moto-used',
        name: 'Auto & Moto',
        slug: 'auto-moto-occasion',
        image: '/images/categories/secondhand-auto.jpg',
        types: ['Pièces', 'Accessoires', 'Équipements', 'Outils'],
        filters: ['Type', 'État', 'Compatible', 'Prix']
      },
      {
        id: 'professional-equipment-used',
        name: 'Matériel Professionnel',
        slug: 'materiel-pro-occasion',
        image: '/images/categories/secondhand-pro.jpg',
        types: ['Bureau', 'Outils', 'Équipements', 'Matériel'],
        filters: ['Type', 'État', 'Fonctionnel', 'Prix']
      }
    ]
  },

  // ==================== ARTICLES DE SPORT ====================
  SPORTS: {
    id: 'sports',
    name: 'Articles de Sport',
    slug: 'articles-sport',
    description: 'Équipements et vêtements sportifs pour toutes les activités',
    image: '/images/categories/sports.jpg',
    icon: '⚽',
    color: 'bg-orange-500',
    featured: true,
    subcategories: [
      {
        id: 'fitness',
        name: 'Sport & Fitness',
        slug: 'sport-fitness',
        image: '/images/categories/fitness.jpg',
        brands: ['Decathlon', 'Nike', 'Adidas', 'Reebok', 'Under Armour']
      },
      {
        id: 'sports-instruments',
        name: 'Instruments & Accessoires de Sport',
        slug: 'instruments-accessoires-sport',
        image: '/images/categories/sports-gear.jpg',
        brands: ['Nike', 'Adidas', 'Puma', 'Wilson', 'Spalding']
      },
      {
        id: 'outdoor-sports',
        name: 'Sports de Plein Air',
        slug: 'sports-plein-air',
        image: '/images/categories/outdoor.jpg',
        brands: ['The North Face', 'Columbia', 'Salomon', 'Quechua']
      },
      {
        id: 'water-sports',
        name: 'Sports Nautiques',
        slug: 'sports-nautiques',
        image: '/images/categories/water-sports.jpg',
        brands: ['Speedo', 'Arena', 'Body Glove', 'Rip Curl']
      }
    ]
  },

  // ==================== AUTO & MOTO ====================
  AUTO_MOTO: {
    id: 'auto-moto',
    name: 'Voiture & Moto',
    slug: 'auto-moto',
    description: 'Pièces, accessoires et entretien pour véhicules',
    image: '/images/categories/auto-moto.jpg',
    icon: '🚗',
    color: 'bg-red-500',
    featured: false,
    subcategories: [
      {
        id: 'car-maintenance',
        name: 'Entretien de la voiture',
        slug: 'entretien-voiture',
        image: '/images/categories/car-maintenance.jpg'
      },
      {
        id: 'motorcycles',
        name: 'Motos et sports motorisés',
        slug: 'motos-sports-motorises',
        image: '/images/categories/motorcycles.jpg'
      },
      {
        id: 'spare-parts',
        name: 'Pièces de rechange',
        slug: 'pieces-rechange',
        image: '/images/categories/spare-parts.jpg'
      },
      {
        id: 'car-electronics',
        name: 'Electronique auto & Accessoires',
        slug: 'electronique-auto-accessoires',
        image: '/images/categories/car-electronics.jpg'
      },
      {
        id: 'lights-accessories',
        name: 'Feux & Accessoires d\'éclairage',
        slug: 'feux-accessoires-eclairage',
        image: '/images/categories/car-lights.jpg'
      },
      {
        id: 'rv-parts',
        name: 'Pièces & Accessoires de VR',
        slug: 'pieces-accessoires-vr',
        image: '/images/categories/rv-parts.jpg'
      },
      {
        id: 'paints-supplies',
        name: 'Peintures et fournitures',
        slug: 'peintures-fournitures',
        image: '/images/categories/car-paints.jpg'
      },
      {
        id: 'oils-fluids',
        name: 'Huiles & fluides',
        slug: 'huiles-fluides',
        image: '/images/categories/oils-fluids.jpg'
      },
      {
        id: 'tools-equipment',
        name: 'Outils & équipements',
        slug: 'outils-equipements',
        image: '/images/categories/tools-equipment.jpg'
      },
      {
        id: 'interior-accessories',
        name: 'Accessoires intérieur',
        slug: 'accessoires-interieur',
        image: '/images/categories/interior-accessories.jpg'
      },
      {
        id: 'exterior-accessories',
        name: 'Accessoires extérieur',
        slug: 'accessoires-exterieur',
        image: '/images/categories/exterior-accessories.jpg'
      }
    ]
  },

  // ==================== MAISON & BUREAU ====================
  HOME_OFFICE: {
    id: 'home-office',
    name: 'Maison & Bureau',
    slug: 'maison-bureau',
    description: 'Meubles, décoration et fournitures pour votre intérieur',
    image: '/images/categories/home-office.jpg',
    icon: '🏠',
    color: 'bg-purple-500',
    featured: false,
    subcategories: [
      {
        id: 'furniture',
        name: 'Meubles',
        slug: 'meubles',
        image: '/images/categories/furniture.jpg',
        types: ['Salon', 'Chambre', 'Cuisine', 'Salle à manger', 'Bureau']
      },
      {
        id: 'home-decor',
        name: 'Décoration',
        slug: 'decoration',
        image: '/images/categories/home-decor.jpg',
        types: ['Art de la table', 'Luminaire', 'Textile', 'Murale']
      },
      {
        id: 'appliances',
        name: 'Électroménager',
        slug: 'electromenager-maison',
        image: '/images/categories/home-appliances.jpg',
        types: ['Gros électroménager', 'Petit électroménager']
      },
      {
        id: 'bedding',
        name: 'Literie & Linges',
        slug: 'literie-linges',
        image: '/images/categories/bedding.jpg',
        types: ['Draps', 'Couettes', 'Oreillers', 'Couvertures']
      },
      {
        id: 'office-supplies',
        name: 'Bureau & Fournitures',
        slug: 'bureau-fournitures',
        image: '/images/categories/office-supplies.jpg',
        types: ['Papeterie', 'Mobilier bureau', 'Organisation']
      },
      {
        id: 'indoor-gardening',
        name: 'Jardinage intérieur',
        slug: 'jardinage-interieur',
        image: '/images/categories/indoor-gardening.jpg',
        types: ['Plantes', 'Pots', 'Accessoires jardinage']
      }
    ]
  },

  // ==================== MODE ====================
  FASHION: {
    id: 'fashion',
    name: 'Mode',
    slug: 'mode',
    description: 'Vêtements, chaussures et accessoires tendance',
    image: '/images/categories/fashion.jpg',
    icon: '👗',
    color: 'bg-pink-500',
    featured: true,
    subcategories: [
      {
        id: 'clothing',
        name: 'Vêtements',
        slug: 'vetements',
        image: '/images/categories/clothing.jpg',
        types: ['Homme', 'Femme', 'Enfant', 'Unisexe']
      },
      {
        id: 'shoes-bags',
        name: 'Chaussures & Maroquinerie',
        slug: 'chaussures-maroquinerie',
        image: '/images/categories/shoes-bags.jpg',
        types: ['Chaussures', 'Sacs', 'Ceintures', 'Portefeuilles']
      },
      {
        id: 'jewelry-watches',
        name: 'Bijoux & Montres',
        slug: 'bijoux-montres',
        image: '/images/categories/jewelry-watches.jpg',
        types: ['Bijoux', 'Montres', 'Accessoires']
      },
      {
        id: 'accessories',
        name: 'Accessoires',
        slug: 'accessoires-mode',
        image: '/images/categories/fashion-accessories.jpg',
        types: ['Lunettes', 'Chapeaux', 'Écharpes', 'Gants']
      },
      {
        id: 'underwear-swimwear',
        name: 'Sous-vêtements & Maillots',
        slug: 'sous-vetements-maillots',
        image: '/images/categories/underwear-swimwear.jpg',
        types: ['Sous-vêtements', 'Maillots de bain', 'Lingerie']
      },
      {
        id: 'ethnic-fashion',
        name: 'Mode ethnique',
        slug: 'mode-ethnique',
        image: '/images/categories/ethnic-fashion.jpg',
        types: ['Tenues traditionnelles', 'Boubou', 'Kente', 'Wax']
      }
    ]
  },

  // ==================== SUPERMARCHÉ ====================
  SUPERMARKET: {
    id: 'supermarket',
    name: 'Supermarche',
    slug: 'supermarche',
    description: 'Produits alimentaires et d\'entretien au quotidien',
    image: '/images/categories/supermarket.jpg',
    icon: '🛒',
    color: 'bg-green-600',
    featured: true,
    subcategories: [
      {
        id: 'groceries',
        name: 'Épicerie sèche',
        slug: 'epicerie-seche',
        image: '/images/categories/groceries.jpg',
        types: ['Pâtes', 'Riz', 'Conserves', 'Biscuits', 'Boissons']
      },
      {
        id: 'fresh-frozen',
        name: 'Produits frais & Surgelés',
        slug: 'produits-frais-surgeles',
        image: '/images/categories/fresh-frozen.jpg',
        types: ['Fruits', 'Légumes', 'Viandes', 'Poissons', 'Surgelés']
      },
      {
        id: 'beverages',
        name: 'Boissons',
        slug: 'boissons',
        image: '/images/categories/beverages.jpg',
        types: ['Eaux', 'Sodas', 'Jus', 'Alcools', 'Boissons énergisantes']
      },
      {
        id: 'hygiene-beauty',
        name: 'Hygiène & Beauté',
        slug: 'hygiene-beaute',
        image: '/images/categories/hygiene-beauty.jpg',
        types: ['Soins corps', 'Soins visage', 'Hygiène', 'Parfums']
      },
      {
        id: 'cleaning',
        name: 'Entretien maison',
        slug: 'entretien-maison',
        image: '/images/categories/cleaning.jpg',
        types: ['Nettoyage', 'Lessive', 'Désinfection', 'Entretien']
      },
      {
        id: 'baby-products-market',
        name: 'Produits bébés',
        slug: 'produits-bebes-supermarket',
        image: '/images/categories/baby-products-market.jpg',
        types: ['Couches', 'Laits', 'Petits pots', 'Soins bébé']
      },
      {
        id: 'pet-supplies',
        name: 'Animalerie',
        slug: 'animalerie',
        image: '/images/categories/pet-supplies.jpg',
        types: ['Nourriture', 'Accessoires', 'Soins', 'Jouets']
      }
    ]
  },

  // ==================== AUTRES CATÉGORIES ====================
  OTHER_CATEGORIES: {
    id: 'other-categories',
    name: 'Autres catégories',
    slug: 'autres-categories',
    description: 'Découvrez toutes nos autres catégories',
    image: '/images/categories/other-categories.jpg',
    icon: '📦',
    color: 'bg-gray-500',
    featured: false,
    subcategories: [
      {
        id: 'books-movies-music',
        name: 'Livres, Films et Musique',
        slug: 'livres-films-musique',
        image: '/images/categories/books-movies-music.jpg'
      },
      {
        id: 'music-instruments',
        name: 'Instruments de Musique',
        slug: 'instruments-musique',
        image: '/images/categories/music-instruments.jpg'
      },
      {
        id: 'toys-games',
        name: 'Jouets et Jeux',
        slug: 'jouets-jeux',
        image: '/images/categories/toys-games.jpg'
      },
      {
        id: 'garden-outdoor',
        name: 'Jardin et Plein Air',
        slug: 'jardin-plein-air',
        image: '/images/categories/garden-outdoor.jpg'
      },
      {
        id: 'services',
        name: 'Services & Prestations',
        slug: 'services-prestations',
        image: '/images/categories/services.jpg'
      },
      {
        id: 'professional-equipment',
        name: 'Matériel Professionnel',
        slug: 'materiel-professionnel',
        image: '/images/categories/professional-equipment.jpg'
      },
      {
        id: 'collections-antiques',
        name: 'Collections & Antiquités',
        slug: 'collections-antiquites',
        image: '/images/categories/collections-antiques.jpg'
      }
    ]
  }
};

// Helper functions
export const getCategoryBySlug = (slug) => {
  return Object.values(CATEGORIES_CONFIG).find(cat => cat.slug === slug);
};

export const getSubcategoryBySlug = (categorySlug, subcategorySlug) => {
  const category = getCategoryBySlug(categorySlug);
  return category?.subcategories?.find(sub => sub.slug === subcategorySlug);
};

export const getAllCategories = () => {
  return Object.values(CATEGORIES_CONFIG);
};

export const getFeaturedCategories = () => {
  return Object.values(CATEGORIES_CONFIG).filter(cat => cat.featured);
};

export const getSecondHandCategories = () => {
  return Object.values(CATEGORIES_CONFIG).filter(cat => cat.isSecondHand);
};

export const getOfficialStoresCategories = () => {
  return CATEGORIES_CONFIG.OFFICIAL_STORES.subcategories;
};

export const getCategoryHierarchy = () => {
  return Object.values(CATEGORIES_CONFIG).map(category => ({
    ...category,
    subcategories: category.subcategories || []
  }));
};

export const searchCategories = (query) => {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  Object.values(CATEGORIES_CONFIG).forEach(category => {
    if (category.name.toLowerCase().includes(lowerQuery) || 
        category.description.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'category',
        ...category
      });
    }
    
    category.subcategories?.forEach(subcategory => {
      if (subcategory.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'subcategory',
          category: category.name,
          ...subcategory
        });
      }
    });
  });
  
  return results;
};

export default CATEGORIES_CONFIG;
