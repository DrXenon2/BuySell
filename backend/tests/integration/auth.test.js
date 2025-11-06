/**
 * Tests d'intégration pour l'authentification
 */

const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/utils/security');
const supabase = require('../../src/config/supabase');

// Mock Supabase
jest.mock('../../src/config/supabase');

describe('API d\'authentification', () => {
  describe('POST /api/auth/register', () => {
    test('devrait créer un nouvel utilisateur', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        full_name: 'New User',
        phone: '+221701234567'
      };

      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-user-id', email: userData.email } },
        error: null
      });

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...userData, id: 'new-user-id', role: 'user' },
          error: null
        })
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
    });

    test('devrait échouer avec des données invalides', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    test('devrait connecter un utilisateur existant', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-id', email: loginData.email },
          session: { access_token: 'mock-token' }
        },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-id', email: loginData.email, role: 'user' },
          error: null
        })
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.token).toBeDefined();
    });

    test('devrait échouer avec des identifiants incorrects', async () => {
      const wrongData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(wrongData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    test('devrait retourner le profil utilisateur', async () => {
      const token = generateToken(global.testUser);

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: global.testUser,
          error: null
        })
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(global.testUser.id);
    });

    test('devrait échouer sans token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Accès non autorisé');
    });
  });
});
