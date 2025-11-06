/**
 * Script pour générer les fichiers JSON de documentation Swagger
 */

const fs = require('fs');
const path = require('path');
const { specs } = require('../src/docs');

// Créer le dossier docs s'il n'existe pas
const docsDir = path.join(__dirname, '../src/docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Fichiers de sortie
const swaggerJsonPath = path.join(docsDir, 'swagger.json');
const openapiJsonPath = path.join(docsDir, 'openapi.json');

try {
  // Générer swagger.json
  fs.writeFileSync(swaggerJsonPath, JSON.stringify(specs, null, 2));
  console.log('✅ swagger.json généré avec succès');
  
  // Générer openapi.json (identique pour OpenAPI 3.0)
  fs.writeFileSync(openapiJsonPath, JSON.stringify(specs, null, 2));
  console.log('✅ openapi.json généré avec succès');
  
  // Statistiques
  console.log('\n📊 Statistiques de la documentation:');
  console.log(`   📍 Endpoints: ${Object.keys(specs.paths || {}).length}`);
  console.log(`   📋 Schémas: ${Object.keys(specs.components?.schemas || {}).length}`);
  console.log(`   🏷️  Tags: ${specs.tags?.length || 0}`);
  console.log(`   🔐 Sécurité: ${Object.keys(specs.components?.securitySchemes || {}).length}`);
  console.log(`   📝 Réponses: ${Object.keys(specs.components?.responses || {}).length}`);
  
} catch (error) {
  console.error('❌ Erreur lors de la génération des fichiers JSON:', error);
  process.exit(1);
}
