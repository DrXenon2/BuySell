#!/usr/bin/env node

/**
 * Script de migration de la base de données
 * Gère l'application des migrations SQL dans l'ordre
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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
    throw new Error('DATABASE_URL ou SUPABASE_DB_URL non définie dans les variables d\'environnement');
  }

  // Parse l'URL de connexion PostgreSQL
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

// Création de la table de suivi des migrations
async function createMigrationsTable(client) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64) NOT NULL
    );
  `;

  await client.query(createTableQuery);
  logSuccess('Table des migrations créée/vérifiée');
}

// Récupération des migrations appliquées
async function getAppliedMigrations(client) {
  const result = await client.query(`
    SELECT version, name, applied_at, checksum 
    FROM schema_migrations 
    ORDER BY applied_at
  `);
  return result.rows;
}

// Calcul du checksum d'un fichier
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Lecture des fichiers de migration
function getMigrationFiles() {
  const migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsPath)) {
    throw new Error(`Dossier des migrations non trouvé: ${migrationsPath}`);
  }

  const files = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Tri par nom de fichier

  return files.map(file => ({
    filename: file,
    path: path.join(migrationsPath, file),
    version: file.split('_')[0],
    name: file.replace(/^\d+_/, '').replace(/\.sql$/, '').replace(/_/g, ' ')
  }));
}

// Application d'une migration
async function applyMigration(client, migration, content) {
  const checksum = calculateChecksum(content);
  
  // Début de la transaction
  await client.query('BEGIN');
  
  try {
    // Application du script SQL
    log(`Application de la migration: ${migration.filename}`);
    await client.query(content);
    
    // Enregistrement dans la table des migrations
    await client.query(
      `INSERT INTO schema_migrations (version, name, checksum) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (version) DO UPDATE SET 
         name = EXCLUDED.name, 
         checksum = EXCLUDED.checksum, 
         applied_at = CURRENT_TIMESTAMP`,
      [migration.version, migration.name, checksum]
    );
    
    await client.query('COMMIT');
    logSuccess(`Migration appliquée: ${migration.name}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

// Vérification de l'intégrité des migrations
async function verifyMigrationsIntegrity(client, appliedMigrations, migrationFiles) {
  logStep('Vérification de l\'intégrité des migrations');
  
  for (const applied of appliedMigrations) {
    const migrationFile = migrationFiles.find(m => m.version === applied.version);
    
    if (!migrationFile) {
      logWarning(`Migration appliquée non trouvée en fichier: ${applied.version}_${applied.name}`);
      continue;
    }
    
    const fileContent = fs.readFileSync(migrationFile.path, 'utf8');
    const currentChecksum = calculateChecksum(fileContent);
    
    if (applied.checksum !== currentChecksum) {
      throw new Error(
        `Checksum mismatch pour la migration ${applied.version}. ` +
        `Attendu: ${applied.checksum}, Actuel: ${currentChecksum}. ` +
        'Le fichier a été modifié après application.'
      );
    }
  }
  
  logSuccess('Intégrité des migrations vérifiée');
}

// Fonction principale de migration
async function runMigrations() {
  logStep('Démarrage des migrations de base de données');
  
  const config = getDatabaseConfig();
  const client = new Client(config);
  
  try {
    // Connexion à la base de données
    log('Connexion à la base de données...');
    await client.connect();
    logSuccess('Connecté à la base de données');
    
    // Création de la table des migrations
    await createMigrationsTable(client);
    
    // Récupération des migrations appliquées
    const appliedMigrations = await getAppliedMigrations(client);
    logSuccess(`${appliedMigrations.length} migration(s) déjà appliquée(s)`);
    
    // Lecture des fichiers de migration
    const migrationFiles = getMigrationFiles();
    logSuccess(`${migrationFiles.length} fichier(s) de migration trouvé(s)`);
    
    // Vérification de l'intégrité
    await verifyMigrationsIntegrity(client, appliedMigrations, migrationFiles);
    
    // Filtrage des migrations à appliquer
    const migrationsToApply = migrationFiles.filter(migration => 
      !appliedMigrations.some(applied => applied.version === migration.version)
    );
    
    if (migrationsToApply.length === 0) {
      logSuccess('Base de données à jour - aucune migration à appliquer');
      return;
    }
    
    log(`Migrations à appliquer: ${migrationsToApply.length}`);
    
    // Application des migrations dans l'ordre
    for (const migration of migrationsToApply) {
      const content = fs.readFileSync(migration.path, 'utf8');
      
      if (!content.trim()) {
        logWarning(`Migration vide: ${migration.filename}`);
        continue;
      }
      
      await applyMigration(client, migration, content);
    }
    
    logSuccess(`✅ ${migrationsToApply.length} migration(s) appliquée(s) avec succès`);
    
  } catch (error) {
    logError(`Erreur lors des migrations: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}

// Fonction de rollback (optionnelle)
async function rollbackMigration(version = null) {
  logStep('Rollback de migration');
  
  const config = getDatabaseConfig();
  const client = new Client(config);
  
  try {
    await client.connect();
    
    if (version) {
      // Rollback d'une migration spécifique
      const result = await client.query(
        'SELECT * FROM schema_migrations WHERE version = $1',
        [version]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Migration ${version} non trouvée`);
      }
      
      logWarning(`Rollback manuel requis pour la migration: ${version}`);
      log('Note: Le rollback automatique n\'est pas implémenté pour des raisons de sécurité.');
      log('Veuillez exécuter manuellement les commandes SQL de rollback.');
      
    } else {
      // Affichage des migrations appliquées
      const appliedMigrations = await getAppliedMigrations(client);
      if (appliedMigrations.length === 0) {
        logSuccess('Aucune migration appliquée');
        return;
      }
      
      log('Migrations appliquées:');
      appliedMigrations.forEach(migration => {
        log(`  ${migration.version} - ${migration.name} (${migration.applied_at})`);
      });
    }
    
  } finally {
    await client.end();
  }
}

// Fonction de statut
async function showStatus() {
  logStep('Statut des migrations');
  
  const config = getDatabaseConfig();
  const client = new Client(config);
  
  try {
    await client.connect();
    
    const appliedMigrations = await getAppliedMigrations(client);
    const migrationFiles = getMigrationFiles();
    
    log('Migrations appliquées:');
    appliedMigrations.forEach(migration => {
      log(`  ${colors.green}✓${colors.reset} ${migration.version} - ${migration.name}`);
    });
    
    const pendingMigrations = migrationFiles.filter(m => 
      !appliedMigrations.some(applied => applied.version === m.version)
    );
    
    if (pendingMigrations.length > 0) {
      log('\nMigrations en attente:');
      pendingMigrations.forEach(migration => {
        log(`  ${colors.yellow}○${colors.reset} ${migration.version} - ${migration.name}`);
      });
    } else {
      logSuccess('\nToutes les migrations sont appliquées');
    }
    
  } finally {
    await client.end();
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'rollback':
        await rollbackMigration(args[1]);
        break;
      case 'status':
        await showStatus();
        break;
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        await runMigrations();
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  log(`${colors.bright}Usage:${colors.reset}
  node scripts/migrate.js          - Applique toutes les migrations en attente
  node scripts/migrate.js status    - Affiche le statut des migrations
  node scripts/migrate.js rollback  - Affiche les migrations pour rollback manuel
  node scripts/migrate.js rollback <version> - Info pour rollback spécifique
  
${colors.bright}Variables d'environnement:${colors.reset}
  DATABASE_URL          - URL de connexion PostgreSQL
  SUPABASE_DB_URL       - Alternative pour Supabase
  NODE_ENV              - Environnement (development/production)
  `);
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = {
  runMigrations,
  rollbackMigration,
  showStatus
};
