/**
 * Nettoyage après les tests
 */

const redis = require('../src/config/redis');

module.exports = async () => {
  try {
    // Fermer les connexions Redis
    if (redis.client) {
      await redis.client.quit();
    }
    
    // Nettoyer les fichiers temporaires
    // (implémentation spécifique si nécessaire)
    
    console.log('✅ Nettoyage des tests terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
};
