#!/usr/bin/env node

/**
 * Script de setup et d'initialisation du backend
 * Configure l'environnement, la base de données et les dépendances
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction de log colorisé
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n${colors.bright}${colors.cyan}▶ ${step}${colors.reset}`, 'reset');
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

// Vérification des prérequis
function checkPrerequisites() {
  logStep('Vérification des prérequis système');
  
  const prerequisites = [
    { name: 'Node.js', command: 'node --version', minVersion: '18.0.0' },
    { name: 'npm', command: 'npm --version', minVersion: '8.0.0' },
    { name: 'Git', command: 'git --version' }
  ];

  let allOk = true;

  prerequisites.forEach(({ name, command, minVersion }) => {
    try {
      const output = execSync(command, { encoding: 'utf8' }).trim();
      if (minVersion) {
        const version = output.match(/\d+\.\d+\.\d+/)[0];
        if (compareVersions(version, minVersion) < 0) {
          logWarning(`${name}: ${output} (minimum ${minVersion} requis)`);
          allOk = false;
        } else {
          logSuccess(`${name}: ${output}`);
        }
      } else {
        logSuccess(`${name}: ${output}`);
      }
    } catch (error) {
      logError(`${name}: Non installé`);
      allOk = false;
    }
  });

  return allOk;
}

// Comparaison de versions
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 !== part2) {
      return part1 - part2;
    }
  }
  return 0;
}

// Copie des fichiers d'environnement
function setupEnvironment() {
  logStep('Configuration des variables d\'environnement');
  
  const envFiles = [
    { source: '.env.example', target: '.env' },
    { source: '.env.development.example', target: '.env.development' }
  ];

  envFiles.forEach(({ source, target }) => {
    const sourcePath = path.join(__dirname, '..', source);
    const targetPath = path.join(__dirname, '..', target);
    
    if (fs.existsSync(sourcePath)) {
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        logSuccess(`Fichier ${target} créé`);
      } else {
        logWarning(`Fichier ${target} existe déjà`);
      }
    } else {
      logWarning(`Fichier source ${source} non trouvé`);
    }
  });
}

// Installation des dépendances
function installDependencies() {
  logStep('Installation des dépendances');
  
  try {
    log('Installation des dépendances principales...');
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    // Installation des dépendances de développement
    log('Installation des dépendances de développement...');
    execSync('npm install --save-dev', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    logSuccess('Dépendances installées avec succès');
  } catch (error) {
    logError('Erreur lors de l\'installation des dépendances');
    throw error;
  }
}

// Configuration de la base de données
async function setupDatabase() {
  logStep('Configuration de la base de données');
  
  return new Promise((resolve, reject) => {
    rl.question('Voulez-vous configurer la base de données maintenant ? (o/N): ', async (answer) => {
      if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
        try {
          // Exécution des migrations
          log('Exécution des migrations...');
          execSync('node scripts/migrate.js', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
          });
          
          // Peuplement des données initiales
          log('Peuplement des données initiales...');
          execSync('node scripts/seed_database.js', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
          });
          
          logSuccess('Base de données configurée avec succès');
          resolve();
        } catch (error) {
          logError('Erreur lors de la configuration de la base de données');
          reject(error);
        }
      } else {
        logWarning('Configuration de la base de données ignorée');
        resolve();
      }
    });
  });
}

// Vérification de la configuration
function validateConfiguration() {
  logStep('Validation de la configuration');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const envPath = path.join(__dirname, '..', '.env');
  let missingVars = [];
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    requiredEnvVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      }
    });
  } else {
    missingVars = requiredEnvVars;
  }
  
  if (missingVars.length > 0) {
    logWarning(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
    log('Veuillez les configurer dans le fichier .env');
    return false;
  }
  
  logSuccess('Configuration validée');
  return true;
}

// Création des dossiers nécessaires
function createRequiredFolders() {
  logStep('Création des dossiers nécessaires');
  
  const folders = [
    'uploads',
    'logs',
    'temp',
    'backups'
  ];
  
  folders.forEach(folder => {
    const folderPath = path.join(__dirname, '..', folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      logSuccess(`Dossier créé: ${folder}`);
    }
  });
}

// Affichage des prochaines étapes
function showNextSteps() {
  logStep('Prochaines étapes');
  
  const steps = [
    '1. Configurez les variables d\'environnement dans .env',
    '2. Lancez le serveur de développement: npm run dev',
    '3. Accédez à l\'API: http://localhost:3001',
    '4. Consultez la documentation: docs/API_DOCUMENTATION.md'
  ];
  
  steps.forEach(step => {
    log(step, 'blue');
  });
}

// Fonction principale
async function main() {
  log(`${colors.bright}${colors.magenta}
  🚀 Setup Backend - Plateforme Buy/Sell
  ${colors.reset}`);
  
  try {
    // Vérification des prérequis
    if (!checkPrerequisites()) {
      logError('Prérequis système non satisfaits');
      process.exit(1);
    }
    
    // Configuration de l'environnement
    setupEnvironment();
    
    // Création des dossiers
    createRequiredFolders();
    
    // Installation des dépendances
    installDependencies();
    
    // Validation de la configuration
    const configValid = validateConfiguration();
    
    if (configValid) {
      // Configuration de la base de données
      await setupDatabase();
    }
    
    // Affichage des prochaines étapes
    showNextSteps();
    
    logSuccess('\n✅ Setup terminé avec succès !');
    
  } catch (error) {
    logError(`\n❌ Erreur lors du setup: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}Usage:${colors.reset}
  node scripts/setup.js          - Setup complet
  node scripts/setup.js --env    - Configuration environnement seulement
  node scripts/setup.js --deps   - Installation dépendances seulement
  node scripts/setup.js --db     - Configuration base de données seulement
  `);
  process.exit(0);
}

// Exécution conditionnelle basée sur les arguments
if (args.includes('--env')) {
  setupEnvironment();
  process.exit(0);
} else if (args.includes('--deps')) {
  installDependencies();
  process.exit(0);
} else if (args.includes('--db')) {
  setupDatabase();
  process.exit(0);
} else {
  // Setup complet
  main();
}
