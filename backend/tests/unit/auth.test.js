/**
 * Tests unitaires pour le middleware d'authentification
 */

const { authenticateToken, authorizeRoles } = require('../../../src/middleware/auth');
const { generateToken } = require('../../../src/utils/security');

describe('Middleware d\'authentification', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createTestRequest();
    mockRes = createTestResponse();
    mockNext = createNextFunction();
  });

  describe('authenticateToken', () => {
    test('devrait passer avec un token valide', async () => {
      const token = generateToken(global.testUser);
      mockReq.headers.authorization = `Bearer ${token}`;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toMatchObject({
        id: global.testUser.id,
        email: global.testUser.email
      });
    });

    test('devrait échouer sans token', async () => {
      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Accès non autorisé',
        message: 'Token manquant'
      });
    });

    test('devrait échouer avec un token invalide', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Accès non autorisé',
        message: 'Token invalide'
      });
    });
  });

  describe('authorizeRoles', () => {
    test('devrait autoriser les rôles spécifiés', () => {
      mockReq.user = { role: 'admin' };
      const middleware = authorizeRoles(['admin', 'seller']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('devrait refuser les rôles non autorisés', () => {
      mockReq.user = { role: 'user' };
      const middleware = authorizeRoles(['admin']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Accès refusé',
        message: 'Permissions insuffisantes'
      });
    });

    test('devrait échouer sans utilisateur authentifié', () => {
      const middleware = authorizeRoles(['admin']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
