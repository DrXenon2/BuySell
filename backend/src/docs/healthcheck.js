/**
 * Vérification de l'état de la documentation Swagger
 */

const config = require('../../config');
const { specs } = require('./index');

function checkDocumentationHealth() {
  console.log('🔍 Vérification de la documentation Swagger...');
  
  const results = {
    healthy: true,
    issues: [],
    stats: {}
  };

  // Vérifier la configuration
  if (!config.docs?.enabled) {
    console.log('ℹ️  Documentation désactivée dans la configuration');
    return results;
  }

  // Vérifier les paths
  const paths = specs.paths;
  if (!paths || Object.keys(paths).length === 0) {
    results.healthy = false;
    results.issues.push('Aucun endpoint documenté trouvé');
  } else {
    results.stats.endpoints = Object.keys(paths).length;
    console.log(`✅ ${results.stats.endpoints} endpoints documentés`);
  }

  // Vérifier les schémas
  const schemas = specs.components?.schemas;
  if (!schemas || Object.keys(schemas).length === 0) {
    results.healthy = false;
    results.issues.push('Aucun schéma documenté trouvé');
  } else {
    results.stats.schemas = Object.keys(schemas).length;
    console.log(`✅ ${results.stats.schemas} schémas documentés`);
  }

  // Vérifier les tags
  const tags = specs.tags;
  if (!tags || tags.length === 0) {
    results.healthy = false;
    results.issues.push('Aucun tag défini');
  } else {
    results.stats.tags = tags.length;
    console.log(`✅ ${results.stats.tags} tags définis`);
  }

  // Vérifier les réponses d'erreur
  const responses = specs.components?.responses;
  if (!responses || Object.keys(responses).length === 0) {
    console.warn('⚠️  Aucune réponse d\'erreur standardisée définie');
  } else {
    results.stats.responses = Object.keys(responses).length;
    console.log(`✅ ${results.stats.responses} réponses standardisées`);
  }

  // Résumé
  if (results.healthy) {
    console.log('🎉 Documentation Swagger en bonne santé!');
    console.log('📊 Statistiques:');
    console.log(`   - Endpoints: ${results.stats.endpoints}`);
    console.log(`   - Schémas: ${results.stats.schemas}`);
    console.log(`   - Tags: ${results.stats.tags}`);
    console.log(`   - Réponses: ${results.stats.responses || 0}`);
  } else {
    console.error('❌ Problèmes détectés dans la documentation:');
    results.issues.forEach(issue => console.error(`   - ${issue}`));
  }

  return results;
}

module.exports = { checkDocumentationHealth };
