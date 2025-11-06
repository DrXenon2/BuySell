/**
 * Script d'export de la documentation Swagger
 */

const fs = require('fs');
const path = require('path');
const { specs } = require('../src/docs');

const exportDir = path.join(__dirname, '../exports');
const swaggerFile = path.join(exportDir, 'swagger.json');
const openapiFile = path.join(exportDir, 'openapi.json');

// Créer le dossier d'export s'il n'existe pas
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

try {
  // Exporter en JSON
  fs.writeFileSync(swaggerFile, JSON.stringify(specs, null, 2));
  fs.writeFileSync(openapiFile, JSON.stringify(specs, null, 2));
  
  console.log('✅ Documentation Swagger exportée avec succès:');
  console.log(`   📄 ${swaggerFile}`);
  console.log(`   📄 ${openapiFile}`);
  console.log(`   📊 ${Object.keys(specs.paths || {}).length} endpoints documentés`);
  console.log(`   🏷️  ${specs.tags?.length || 0} tags définis`);
  console.log(`   📋 ${Object.keys(specs.components?.schemas || {}).length} schémas définis`);
  
} catch (error) {
  console.error('❌ Erreur lors de l\'export de la documentation:', error);
  process.exit(1);
}
