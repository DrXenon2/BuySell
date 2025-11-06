#!/usr/bin/env node

/**
 * Script de vérification de santé de l'application
 * Vérifie la base de données, les services externes et les dépendances
 */

const { Client } = require('pg');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
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
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000
  };
}

// Vérification des ressources système
async function checkSystemResources() {
  logStep('Vérification des ressources système');
  
  const checks = [];
  
  // Mémoire
  const totalMem = os.totalmem() / (1024 ** 3); // GB
  const freeMem = os.freemem() / (1024 ** 3);
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;
  
  checks.push({
    name: 'Mémoire RAM',
    status: memUsage < 90,
    message: `${memUsage.toFixed(1)}% utilisée (${freeMem.toFixed(1)}GB libre / ${totalMem.toFixed(1)}GB total)`,
    critical: memUsage > 95
  });
  
  // CPU
  const loadAverage = os.loadavg();
  const cpuCount = os.cpus().length;
  const loadPercent = (loadAverage[0] / cpuCount) * 100;
  
  checks.push({
    name: 'Charge CPU',
    status: loadPercent < 80,
    message: `Charge: ${loadAverage[0].toFixed(2)} (${loadPercent.toFixed(1)}% sur ${cpuCount} cores)`,
    critical: loadPercent > 90
  });
  
  // Disk space
  try {
    const diskInfo = execSync('df -h /', { encoding: 'utf8' });
    const lines = diskInfo.trim().split('\n');
    const diskData = lines[1].split(/\s+/);
    const usage = parseInt(diskData[4]);
    
    checks.push({
      name: 'Espace disque (/)',
      status: usage < 90,
      message: `${usage}% utilisé (${diskData[3]} libre)`,
      critical: usage > 95
    });
  } catch (error) {
    checks.push({
      name: 'Espace disque',
      status: false,
      message: 'Impossible de vérifier l\'espace disque',
      critical: false
    });
  }
  
  // Affichage des résultats
  checks.forEach(check => {
    if (check.status) {
      logSuccess(`${check.name}: ${check.message}`);
    } else if (check.critical) {
      logError(`${check.name}: ${check.message} - CRITIQUE`);
    } else {
      logWarning(`${check.name}: ${check.message}`);
    }
  });
  
  return checks.every(check => check.status || !check.critical);
}

// Vérification de la base de données
async function checkDatabase(client) {
  logStep('Vérification de la base de données');
  
  const checks = [];
  
  try {
    // Test de connexion basique
    const startTime = Date.now();
    await client.query('SELECT 1 as test');
    const responseTime = Date.now() - startTime;
    
    checks.push({
      name: 'Connexion DB',
      status: true,
      message: `Connecté (${responseTime}ms)`
    });
    
    // Vérification des tables essentielles
    const essentialTables = ['users', 'products', 'categories', 'orders'];
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ($1, $2, $3, $4)
    `, essentialTables);
    
    const missingTables = essentialTables.filter(
      table => !tableCheck.rows.some(row => row.table_name === table)
    );
    
    checks.push({
      name: 'Tables essentielles',
      status: missingTables.length === 0,
      message: missingTables.length > 0 
        ? `Tables manquantes: ${missingTables.join(', ')}`
        : `Toutes les tables présentes (${essentialTables.length})`
    });
    
    // Vérification des données
    const dataChecks = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM products WHERE is_available = true'),
      client.query('SELECT COUNT(*) as count FROM categories WHERE is_active = true')
    ]);
    
    const userCount = parseInt(dataChecks[0].rows[0].count);
    const productCount = parseInt(dataChecks[1].rows[0].count);
    const categoryCount = parseInt(dataChecks[2].rows[0].count);
    
    checks.push({
      name: 'Données utilisateurs',
      status: userCount > 0,
      message: `${userCount} utilisateur(s)`
    });
    
    checks.push({
      name: 'Données produits',
      status: productCount > 0,
      message: `${productCount} produit(s) actif(s)`
    });
    
    checks.push({
      name: 'Données catégories',
      status: categoryCount > 0,
      message: `${categoryCount} catégorie(s) active(s)`
    });
    
    // Vérification des performances
    const perfStart = Date.now();
    await client.query('SELECT COUNT(*) FROM products WHERE price > 0');
    const perfTime = Date.now() - perfStart;
    
    checks.push({
      name: 'Performance requêtes',
      status: perfTime < 1000,
      message: `Requête test: ${perfTime}ms`,
      warning: perfTime > 500
    });
    
  } catch (error) {
    checks.push({
      name: 'Connexion DB',
      status: false,
      message: `Erreur: ${error.message}`,
      critical: true
    });
  }
  
  // Affichage des résultats
  checks.forEach(check => {
    if (check.status && !check.warning) {
      logSuccess(`${check.name}: ${check.message}`);
    } else if (check.status && check.warning) {
      logWarning(`${check.name}: ${check.message} - LENT`);
    } else if (check.critical) {
      logError(`${check.name}: ${check.message} - CRITIQUE`);
    } else {
      logWarning(`${check.name}: ${check.message}`);
    }
  });
  
  return checks.every(check => check.status && !check.critical);
}

// Vérification des services externes
async function checkExternalServices() {
  logStep('Vérification des services externes');
  
  const checks = [];
  
  // Vérification Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        timeout: 5000
      });
      
      checks.push({
        name: 'Service Supabase',
        status: response.ok,
        message: response.ok ? 'Connecté' : `Erreur: ${response.status}`,
        critical: !response.ok
      });
    } catch (error) {
      checks.push({
        name: 'Service Supabase',
        status: false,
        message: `Erreur: ${error.message}`,
        critical: true
      });
    }
  } else {
    checks.push({
      name: 'Service Supabase',
      status: false,
      message: 'Configuration manquante',
      critical: false
    });
  }
  
  // Vérification Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.products.list({ limit: 1 });
      
      checks.push({
        name: 'Service Stripe',
        status: true,
        message: 'Connecté'
      });
    } catch (error) {
      checks.push({
        name: 'Service Stripe',
        status: false,
        message: `Erreur: ${error.message}`,
        critical: false
      });
    }
  } else {
    checks.push({
      name: 'Service Stripe',
      status: false,
      message: 'Configuration manquante',
      critical: false
    });
  }
  
  // Vérification Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    checks.push({
      name: 'Service Cloudinary',
      status: true,
      message: 'Configuré'
    });
  } else {
    checks.push({
      name: 'Service Cloudinary',
      status: false,
      message: 'Configuration manquante',
      critical: false
    });
  }
  
  // Affichage des résultats
  checks.forEach(check => {
    if (check.status) {
      logSuccess(`${check.name}: ${check.message}`);
    } else if (check.critical) {
      logError(`${check.name}: ${check.message} - CRITIQUE`);
    } else {
      logWarning(`${check.name}: ${check.message}`);
    }
  });
  
  return checks.every(check => check.status || !check.critical);
}

// Vérification de l'application
async function checkApplication() {
  logStep('Vérification de l\'application');
  
  const checks = [];
  
  // Vérification des variables d'environnement critiques
  const criticalEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ];
  
  const missingEnvVars = criticalEnvVars.filter(varName => !process.env[varName]);
  
  checks.push({
    name: 'Variables d\'environnement',
    status: missingEnvVars.length === 0,
    message: missingEnvVars.length > 0 
      ? `Manquantes: ${missingEnvVars.join(', ')}`
      : 'Toutes les variables critiques sont définies',
    critical: missingEnvVars.length > 0
  });
  
  // Vérification des fichiers de configuration
  const requiredFiles = [
    'package.json',
    '.env',
    'src/app.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(__dirname, '..', file))
  );
  
  checks.push({
    name: 'Fichiers de configuration',
    status: missingFiles.length === 0,
    message: missingFiles.length > 0 
      ? `Manquants: ${missingFiles.join(', ')}`
      : 'Tous les fichiers requis présents',
    critical: missingFiles.length > 0
  });
  
  // Vérification des dépendances
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depCount = Object.keys(deps).length;
    
    checks.push({
      name: 'Dépendances',
      status: true,
      message: `${depCount} dépendance(s) configurée(s)`
    });
    
    // Test d'import des modules critiques
    const criticalModules = ['express', 'bcryptjs', 'jsonwebtoken', 'cors'];
    const missingModules = criticalModules.filter(module => {
      try {
        require(module);
        return false;
      } catch {
        return true;
      }
    });
    
    checks.push({
      name: 'Modules critiques',
      status: missingModules.length === 0,
      message: missingModules.length > 0 
        ? `Manquants: ${missingModules.join(', ')}`
        : 'Tous les modules critiques chargés',
      critical: missingModules.length > 0
    });
    
  } catch (error) {
    checks.push({
      name: 'Configuration',
      status: false,
      message: `Erreur: ${error.message}`,
      critical: true
    });
  }
  
  // Affichage des résultats
  checks.forEach(check => {
    if (check.status) {
      logSuccess(`${check.name}: ${check.message}`);
    } else if (check.critical) {
      logError(`${check.name}: ${check.message} - CRITIQUE`);
    } else {
      logWarning(`${check.name}: ${check.message}`);
    }
  });
  
  return checks.every(check => check.status || !check.critical);
}

// Vérification du réseau
async function checkNetwork() {
  logStep('Vérification réseau');
  
  const checks = [];
  
  // Vérification de la connectivité internet
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      timeout: 5000 
    });
    
    checks.push({
      name: 'Connectivité Internet',
      status: response.ok,
      message: response.ok ? 'Connecté' : 'Erreur de connexion'
    });
  } catch (error) {
    checks.push({
      name: 'Connectivité Internet',
      status: false,
      message: `Erreur: ${error.message}`
    });
  }
  
  // Vérification DNS
  try {
    const dns = require('dns');
    await dns.promises.lookup('google.com');
    
    checks.push({
      name: 'Résolution DNS',
      status: true,
      message: 'DNS fonctionnel'
    });
  } catch (error) {
    checks.push({
      name: 'Résolution DNS',
      status: false,
      message: `Erreur: ${error.message}`
    });
  }
  
  // Affichage des résultats
  checks.forEach(check => {
    if (check.status) {
      logSuccess(`${check.name}: ${check.message}`);
    } else {
      logWarning(`${check.name}: ${check.message}`);
    }
  });
  
  return checks.every(check => check.status);
}

// Génération de rapport de santé
function generateHealthReport(systemOk, dbOk, servicesOk, appOk, networkOk) {
  logStep('Rapport de santé global');
  
  const overallStatus = systemOk && dbOk && servicesOk && appOk;
  const statusColor = overallStatus ? 'green' : 'red';
  const statusEmoji = overallStatus ? '✅' : '❌';
  const statusText = overallStatus ? 'SAIN' : 'PROBLÈMES DÉTECTÉS';
  
  log(`${statusEmoji} ${colors.bright}${colors[statusColor]}Santé globale: ${statusText}${colors.reset}`);
  
  log('\nDétails des vérifications:');
  log(`• Système: ${systemOk ? '✅' : '❌'}`);
  log(`• Base de données: ${dbOk ? '✅' : '❌'}`);
  log(`• Services externes: ${servicesOk ? '✅' : '❌'}`);
  log(`• Application: ${appOk ? '✅' : '❌'}`);
  log(`• Réseau: ${networkOk ? '✅' : '❌'}`);
  
  if (!overallStatus) {
    logWarning('\nRecommandations:');
    if (!systemOk) log('  - Vérifier les ressources système (RAM, CPU, disque)');
    if (!dbOk) log('  - Vérifier la connexion et les données de la base');
    if (!servicesOk) log('  - Vérifier la configuration des services externes');
    if (!appOk) log('  - Vérifier les variables d\'environnement et dépendances');
  }
  
  return {
    timestamp: new Date().toISOString(),
    overall: overallStatus,
    system: systemOk,
    database: dbOk,
    services: servicesOk,
    application: appOk,
    network: networkOk,
    environment: process.env.NODE_ENV || 'development'
  };
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const quick = args.includes('--quick');
  const verbose = args.includes('--verbose');
  const jsonOutput = args.includes('--json');
  
  if (!jsonOutput) {
    log(`${colors.bright}${colors.magenta}
  🩺 Health Check - Plateforme Buy/Sell
  ${colors.reset}`);
  }
  
  const config = getDatabaseConfig();
  const client = new Client(config);
  
  let report;
  
  try {
    // Connexion à la base de données
    if (!quick) {
      await client.connect();
    }
    
    // Exécution des vérifications
    const systemOk = await checkSystemResources();
    const dbOk = quick ? true : await checkDatabase(client);
    const servicesOk = quick ? true : await checkExternalServices();
    const appOk = await checkApplication();
    const networkOk = quick ? true : await checkNetwork();
    
    // Génération du rapport
    report = generateHealthReport(systemOk, dbOk, servicesOk, appOk, networkOk);
    
    // Sortie JSON si demandée
    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    }
    
    // Code de sortie approprié
    if (!report.overall) {
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Erreur lors du health check: ${error.message}`);
    process.exit(1);
  } finally {
    if (client._connected) {
      await client.end();
    }
  }
}

// Gestion des arguments
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    log(`${colors.bright}Usage:${colors.reset}
  node scripts/healthcheck.js           - Vérification complète
  node scripts/healthcheck.js --quick   - Vérification rapide (sans DB/services)
  node scripts/healthcheck.js --verbose - Sortie détaillée
  node scripts/healthcheck.js --json    - Sortie JSON pour monitoring
  
${colors.bright}Vérifications effectuées:${colors.reset}
  • Ressources système (RAM, CPU, disque)
  • Base de données (connexion, tables, données)
  • Services externes (Supabase, Stripe, Cloudinary)
  • Application (variables, fichiers, dépendances)
  • Réseau (internet, DNS)
  
${colors.bright}Codes de sortie:${colors.reset}
  0 - Application saine
  1 - Problèmes détectés
    `);
    process.exit(0);
  }
  
  main();
}

module.exports = {
  checkSystemResources,
  checkDatabase,
  checkExternalServices,
  checkApplication,
  checkNetwork,
  generateHealthReport,
  runHealthCheck: main
};
