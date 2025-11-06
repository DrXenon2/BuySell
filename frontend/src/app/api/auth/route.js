import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    // Simulation d'API - À remplacer par vos appels réels
    const responses = {
      login: async ({ email, password }) => {
        // Simulation de vérification
        if (email === 'admin@buysell.com' && password === 'password') {
          return {
            success: true,
            data: {
              user: {
                id: '1',
                email: 'admin@buysell.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                avatar: null
              },
              tokens: {
                accessToken: 'fake-jwt-token',
                refreshToken: 'fake-refresh-token',
                expiresIn: 3600
              }
            }
          };
        }
        throw new Error('Identifiants invalides');
      },

      register: async (userData) => {
        return {
          success: true,
          data: {
            user: {
              id: '2',
              ...userData,
              role: 'customer',
              avatar: null
            },
            tokens: {
              accessToken: 'fake-jwt-token',
              refreshToken: 'fake-refresh-token',
              expiresIn: 3600
            }
          }
        };
      },

      refresh: async ({ refreshToken }) => {
        return {
          success: true,
          data: {
            accessToken: 'new-fake-jwt-token',
            refreshToken: 'new-fake-refresh-token',
            expiresIn: 3600
          }
        };
      },

      logout: async () => {
        return { success: true };
      }
    };

    if (!responses[action]) {
      return NextResponse.json(
        { success: false, error: 'Action non supportée' },
        { status: 400 }
      );
    }

    const result = await responses[action](payload);
    return NextResponse.json(result);

  } catch (error) {
    console.error('API Auth Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur d\'authentification' 
      },
      { status: 401 }
    );
  }
}
