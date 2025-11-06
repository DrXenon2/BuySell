#!/usr/bin/env node

/**
 * Script de peuplement de la base de données avec des données de test
 * Crée des utilisateurs, produits, catégories, etc. pour le développement
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n${colors.bright}${colors.cyan}▶ ${step}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Configuration de la base de données
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL ou SUPABASE_DB_URL non définie');
  }

  const url = new URL(databaseUrl);
  
  return {
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.substring(1),
    user: url.username,
    password: url.password,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
}

// Données de test
const sampleData = {
  // Catégories
  categories: [
    {
      name: 'Électronique',
      slug: 'electronique',
      description: 'Appareils électroniques et gadgets',
      image_url: '/images/categories/electronics.jpg',
      is_active: true,
      metadata: { color: '#3B82F6', icon: '📱' }
    },
    {
      name: 'Mode & Vêtements',
      slug: 'mode-vetements',
      description: 'Vêtements, chaussures et accessoires',
      image_url: '/images/categories/fashion.jpg',
      is_active: true,
      metadata: { color: '#EF4444', icon: '👕' }
    },
    {
      name: 'Maison & Jardin',
      slug: 'maison-jardin',
      description: 'Meubles, décoration et articles de jardin',
      image_url: '/images/categories/home.jpg',
      is_active: true,
      metadata: { color: '#10B981', icon: '🏠' }
    },
    {
      name: 'Sports & Loisirs',
      slug: 'sports-loisirs',
      description: 'Équipements sportifs et articles de loisir',
      image_url: '/images/categories/sports.jpg',
      is_active: true,
      metadata: { color: '#F59E0B', icon: '⚽' }
    },
    {
      name: 'Livres & Éducation',
      slug: 'livres-education',
      description: 'Livres, fournitures scolaires et éducatives',
      image_url: '/images/categories/books.jpg',
      is_active: true,
      metadata: { color: '#8B5CF6', icon: '📚' }
    }
  ],

  // Utilisateurs
  users: [
    {
      email: 'admin@buysell.com',
      password: 'admin123',
      role: 'admin',
      email_verified: true,
      profile: {
        first_name: 'Admin',
        last_name: 'Système',
        phone: '+221781234567',
        avatar_url: '/images/avatars/admin.jpg'
      }
    },
    {
      email: 'vendor1@buysell.com',
      password: 'vendor123',
      role: 'seller',
      email_verified: true,
      profile: {
        first_name: 'Marie',
        last_name: 'Diop',
        phone: '+221761234568',
        avatar_url: '/images/avatars/vendor1.jpg',
        company_name: 'TechShop SN',
        bio: 'Vendeur spécialisé en électronique'
      }
    },
    {
      email: 'vendor2@buysell.com',
      password: 'vendor123',
      role: 'seller',
      email_verified: true,
      profile: {
        first_name: 'Papa',
        last_name: 'Sarr',
        phone: '+221771234569',
        avatar_url: '/images/avatars/vendor2.jpg',
        company_name: 'Fashion Dakar',
        bio: 'Boutique de mode africaine'
      }
    },
    {
      email: 'customer1@buysell.com',
      password: 'customer123',
      role: 'customer',
      email_verified: true,
      profile: {
        first_name: 'Aminata',
        last_name: 'Ndiaye',
        phone: '+221701234560',
        avatar_url: '/images/avatars/customer1.jpg'
      }
    },
    {
      email: 'customer2@buysell.com',
      password: 'customer123',
      role: 'customer',
      email_verified: true,
      profile: {
        first_name: 'Ibrahima',
        last_name: 'Diallo',
        phone: '+221761234561',
        avatar_url: '/images/avatars/customer2.jpg'
      }
    }
  ],

  // Produits
  products: [
    // Électronique - Vendor1
    {
      name: 'Smartphone Samsung Galaxy S23',
      slug: 'samsung-galaxy-s23',
      description: 'Smartphone Android haut de gamme avec écran 6.1", 128GB de stockage',
      price: 450000,
      compare_price: 499000,
      cost_price: 380000,
      sku: 'SM-GS23-128',
      barcode: '1234567890123',
      quantity: 15,
      track_quantity: true,
      is_available: true,
      category_id: 1, // Électronique
      user_id: 2, // Vendor1
      images: [
        '/images/products/samsung-s23-1.jpg',
        '/images/products/samsung-s23-2.jpg'
      ],
      specifications: {
        marque: 'Samsung',
        modele: 'Galaxy S23',
        ecran: '6.1 pouces',
        stockage: '128GB',
        ram: '8GB',
        camera: '50MP + 12MP + 10MP',
        batterie: '3900mAh'
      },
      metadata: {
        tags: ['smartphone', 'samsung', 'android', '5g'],
        featured: true,
        rating: 4.5
      }
    },
    {
      name: 'Casque Bluetooth Sony WH-1000XM4',
      slug: 'casque-sony-wh1000xm4',
      description: 'Casque audio sans fil avec réduction de bruit active',
      price: 125000,
      compare_price: 149000,
      cost_price: 95000,
      sku: 'SONY-WH1000XM4',
      barcode: '1234567890124',
      quantity: 25,
      track_quantity: true,
      is_available: true,
      category_id: 1,
      user_id: 2,
      images: ['/images/products/sony-headphones.jpg'],
      specifications: {
        marque: 'Sony',
        modele: 'WH-1000XM4',
        type: 'Over-ear',
        connectivite: 'Bluetooth 5.0',
        autonomie: '30 heures',
        reduction_bruit: 'Active'
      },
      metadata: {
        tags: ['casque', 'bluetooth', 'sony', 'audio'],
        featured: false,
        rating: 4.8
      }
    },

    // Mode - Vendor2
    {
      name: 'Boubou Africain Homme Premium',
      slug: 'boubou-africain-homme-premium',
      description: 'Boubou traditionnel africain en tissu wax de haute qualité',
      price: 35000,
      compare_price: 45000,
      cost_price: 22000,
      sku: 'BOU-H-PREM',
      barcode: '1234567890125',
      quantity: 50,
      track_quantity: true,
      is_available: true,
      category_id: 2, // Mode
      user_id: 3, // Vendor2
      images: ['/images/products/boubou-homme.jpg'],
      specifications: {
        tissu: 'Wax 100% coton',
        couleur: 'Multicolore',
        taille: 'Taille Unique',
        origine: 'Côte d\'Ivoire',
        entretien: 'Lavage à la main'
      },
      metadata: {
        tags: ['boubou', 'africain', 'wax', 'traditionnel'],
        featured: true,
        rating: 4.7
      }
    },
    {
      name: 'Sandales Cuir Artisanal',
      slug: 'sandales-cuir-artisanal',
      description: 'Sandales en cuir véritable fabriquées artisanalement',
      price: 18000,
      compare_price: 25000,
      cost_price: 12000,
      sku: 'SAND-CUIR-ART',
      barcode: '1234567890126',
      quantity: 30,
      track_quantity: true,
      is_available: true,
      category_id: 2,
      user_id: 3,
      images: ['/images/products/sandales-cuir.jpg'],
      specifications: {
        materiau: 'Cuir véritable',
        semelle: 'Caoutchouc',
        pointure: '40-45',
        fabrication: 'Artisanale',
        couleur: 'Marron'
      },
      metadata: {
        tags: ['sandales', 'cuir', 'artisanal', 'africain'],
        featured: false,
        rating: 4.4
      }
    },

    // Maison & Jardin - Vendor1
    {
      name: 'Set de Coussins Décoratifs',
      slug: 'set-coussins-decoratifs',
      description: 'Set de 4 coussins décoratifs avec motifs africains',
      price: 25000,
      compare_price: 32000,
      cost_price: 15000,
      sku: 'COUS-DEC-4',
      barcode: '1234567890127',
      quantity: 40,
      track_quantity: true,
      is_available: true,
      category_id: 3, // Maison
      user_id: 2,
      images: ['/images/products/coussins-deco.jpg'],
      specifications: {
        materiau: 'Coton 100%',
        dimensions: '45x45cm',
        lavage: 'Machine à 30°C',
        motifs: 'Africains traditionnels',
        composition: '4 coussins + 4 housses'
      },
      metadata: {
        tags: ['coussins', 'decoration', 'maison', 'africain'],
        featured: true,
        rating: 4.3
      }
    }
  ],

  // Adresses
  addresses: [
    {
      user_id: 4, // Customer1
      type: 'shipping',
      street: '123 Rue de la Corniche',
      city: 'Dakar',
      state: 'Dakar',
      postal_code: '12500',
      country: 'SN',
      is_default: true,
      metadata: { quartier: 'Fann' }
    },
    {
      user_id: 5, // Customer2
      type: 'shipping',
      street: '456 Avenue Bourguiba',
      city: 'Dakar',
      state: 'Dakar',
      postal_code: '12000',
      country: 'SN',
      is_default: true,
      metadata: { quartier: 'Point E' }
    }
  ]
};

// Fonction de hachage de mot de passe
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Vérification si le peuplement a déjà été fait
async function checkAlreadySeeded(client) {
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE email LIKE '%@buysell.com'
    `);
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    return false;
  }
}

// Peuplement des catégories
async function seedCategories(client) {
  logStep('Peuplement des catégories');
  
  for (const category of sampleData.categories) {
    const query = `
      INSERT INTO categories (name, slug, description, image_url, is_active, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        is_active = EXCLUDED.is_active,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id
    `;
    
    const values = [
      category.name,
      category.slug,
      category.description,
      category.image_url,
      category.is_active,
      JSON.stringify(category.metadata)
    ];
    
    const result = await client.query(query, values);
    category.id = result.rows[0].id;
    logSuccess(`Catégorie: ${category.name}`);
  }
}

// Peuplement des utilisateurs
async function seedUsers(client) {
  logStep('Peuplement des utilisateurs');
  
  for (const userData of sampleData.users) {
    const hashedPassword = await hashPassword(userData.password);
    
    // Insertion de l'utilisateur
    const userQuery = `
      INSERT INTO users (email, password, role, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW()
      RETURNING id
    `;
    
    const userValues = [
      userData.email,
      hashedPassword,
      userData.role,
      userData.email_verified
    ];
    
    const userResult = await client.query(userQuery, userValues);
    const userId = userResult.rows[0].id;
    userData.id = userId;
    
    // Insertion du profil
    if (userData.profile) {
      const profileQuery = `
        INSERT INTO profiles (user_id, first_name, last_name, phone, avatar_url, company_name, bio, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          company_name = EXCLUDED.company_name,
          bio = EXCLUDED.bio,
          updated_at = NOW()
      `;
      
      const profileValues = [
        userId,
        userData.profile.first_name,
        userData.profile.last_name,
        userData.profile.phone,
        userData.profile.avatar_url,
        userData.profile.company_name || null,
        userData.profile.bio || null
      ];
      
      await client.query(profileQuery, profileValues);
    }
    
    logSuccess(`Utilisateur: ${userData.email} (${userData.role})`);
  }
}

// Peuplement des produits
async function seedProducts(client) {
  logStep('Peuplement des produits');
  
  for (const productData of sampleData.products) {
    const productQuery = `
      INSERT INTO products (
        name, slug, description, price, compare_price, cost_price, sku, barcode,
        quantity, track_quantity, is_available, category_id, user_id,
        images, specifications, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        compare_price = EXCLUDED.compare_price,
        cost_price = EXCLUDED.cost_price,
        sku = EXCLUDED.sku,
        barcode = EXCLUDED.barcode,
        quantity = EXCLUDED.quantity,
        track_quantity = EXCLUDED.track_quantity,
        is_available = EXCLUDED.is_available,
        category_id = EXCLUDED.category_id,
        user_id = EXCLUDED.user_id,
        images = EXCLUDED.images,
        specifications = EXCLUDED.specifications,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id
    `;
    
    const productValues = [
      productData.name,
      productData.slug,
      productData.description,
      productData.price,
      productData.compare_price,
      productData.cost_price,
      productData.sku,
      productData.barcode,
      productData.quantity,
      productData.track_quantity,
      productData.is_available,
      productData.category_id,
      productData.user_id,
      JSON.stringify(productData.images),
      JSON.stringify(productData.specifications),
      JSON.stringify(productData.metadata)
    ];
    
    const result = await client.query(productQuery, productValues);
    productData.id = result.rows[0].id;
    logSuccess(`Produit: ${productData.name} - ${(productData.price / 100).toFixed(2)} FCFA`);
  }
}

// Peuplement des adresses
async function seedAddresses(client) {
  logStep('Peuplement des adresses');
  
  for (const address of sampleData.addresses) {
    const query = `
      INSERT INTO addresses (user_id, type, street, city, state, postal_code, country, is_default, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;
    
    const values = [
      address.user_id,
      address.type,
      address.street,
      address.city,
      address.state,
      address.postal_code,
      address.country,
      address.is_default,
      JSON.stringify(address.metadata || {})
    ];
    
    await client.query(query, values);
    logSuccess(`Adresse: ${address.street}, ${address.city}`);
  }
}

// Création de quelques commandes de test
async function seedOrders(client) {
  logStep('Création de commandes de test');
  
  // Créer 2 commandes pour customer1
  const order1Query = `
    INSERT INTO orders (user_id, total_amount, status, shipping_address, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW() - INTERVAL '2 days', NOW())
    RETURNING id
  `;
  
  const order1Values = [
    4, // customer1
    475000, // total
    'delivered',
    JSON.stringify(sampleData.addresses[0])
  ];
  
  const order1Result = await client.query(order1Query, order1Values);
  const order1Id = order1Result.rows[0].id;
  
  // Items pour la commande 1
  const orderItems1 = [
    { order_id: order1Id, product_id: 1, quantity: 1, price: 450000 },
    { order_id: order1Id, product_id: 3, quantity: 1, price: 25000 }
  ];
  
  for (const item of orderItems1) {
    await client.query(`
      INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [item.order_id, item.product_id, item.quantity, item.price]);
  }
  
  logSuccess(`Commande #${order1Id} créée (2 produits)`);
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const minimal = args.includes('--minimal');
  
  log(`${colors.bright}${colors.magenta}
  🌱 Script de Peuplement - Plateforme Buy/Sell
  ${colors.reset}`);
  
  const config = getDatabaseConfig();
  const client = new Client(config);
  
  try {
    // Connexion à la base de données
    log('Connexion à la base de données...');
    await client.connect();
    logSuccess('Connecté à la base de données');
    
    // Vérification si déjà peuplé
    if (!force && await checkAlreadySeeded(client)) {
      logWarning('La base de données contient déjà des données de test.');
      log('Utilisez --force pour forcer le peuplement.');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Voulez-vous continuer ? (o/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'oui') {
        log('Peuplement annulé.');
        return;
      }
    }
    
    // Début de la transaction
    await client.query('BEGIN');
    
    // Peuplement des données
    await seedCategories(client);
    await seedUsers(client);
    await seedProducts(client);
    await seedAddresses(client);
    
    if (!minimal) {
      await seedOrders(client);
    }
    
    // Commit de la transaction
    await client.query('COMMIT');
    
    logSuccess('\n✅ Peuplement terminé avec succès !');
    
    // Affichage des informations de connexion
    log(`\n${colors.bright}Comptes de test créés:${colors.reset}`);
    log(`${colors.cyan}Admin:${colors.reset} admin@buysell.com / admin123`);
    log(`${colors.cyan}Vendeur:${colors.reset} vendor1@buysell.com / vendor123`);
    log(`${colors.cyan}Client:${colors.reset} customer1@buysell.com / customer123`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    logError(`Erreur lors du peuplement: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Gestion des arguments
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    log(`${colors.bright}Usage:${colors.reset}
  node scripts/seed_database.js     - Peuplement standard
  node scripts/seed_database.js --force    - Force le peuplement même si déjà fait
  node scripts/seed_database.js --minimal  - Peuplement minimal (sans commandes)
  
${colors.bright}Description:${colors.reset}
  Crée des données de test pour le développement:
  - 5 catégories
  - 5 utilisateurs (admin, vendeurs, clients)
  - 5 produits avec images et spécifications
  - Adresses et commandes de test
    `);
    process.exit(0);
  }
  
  main();
}

module.exports = {
  seedDatabase: main,
  sampleData
};
