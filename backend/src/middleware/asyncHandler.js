/**
 * Wrapper pour gérer les erreurs dans les controllers async
 * Évite d'avoir à utiliser try/catch dans chaque controller
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
