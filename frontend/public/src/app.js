/**
 * Point d'entrée principal de l'application React
 * Utilisé avec le Pages Router de Next.js
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ToastContainer } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages publiques
import HomePage from './pages/Home';
import ProductsPage from './pages/Products';
import ProductDetailPage from './pages/ProductDetail';
import CategoryPage from './pages/Category';
import AboutPage from './pages/About';
import ContactPage from './pages/Contact';

// Pages d'authentification
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';

// Pages utilisateur
import ProfilePage from './pages/profile/Profile';
import OrdersPage from './pages/profile/Orders';
import OrderDetailPage from './pages/profile/OrderDetail';
import AddressesPage from './pages/profile/Addresses';
import WishlistPage from './pages/profile/Wishlist';
import SettingsPage from './pages/profile/Settings';

// Pages panier et checkout
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import CheckoutShippingPage from './pages/checkout/Shipping';
import CheckoutPaymentPage from './pages/checkout/Payment';
import CheckoutConfirmationPage from './pages/checkout/Confirmation';

// Pages vendeur
import SellerDashboardPage from './pages/dashboard/seller/Dashboard';
import SellerProductsPage from './pages/dashboard/seller/Products';
import SellerProductFormPage from './pages/dashboard/seller/ProductForm';
import SellerOrdersPage from './pages/dashboard/seller/Orders';
import SellerAnalyticsPage from './pages/dashboard/seller/Analytics';

// Pages admin
import AdminDashboardPage from './pages/admin/Dashboard';
import AdminUsersPage from './pages/admin/Users';
import AdminProductsPage from './pages/admin/Products';
import AdminOrdersPage from './pages/admin/Orders';
import AdminCategoriesPage from './pages/admin/Categories';
import AdminAnalyticsPage from './pages/admin/Analytics';

// Composants de protection de routes
import AuthGuard from './components/auth/AuthGuard';
import RoleGuard from './components/auth/RoleGuard';

// Utilitaires
import { USER_ROLES } from './utils/constants';

// Styles globaux
import './styles/globals.css';
import './styles/variables.css';
import './styles/animations.css';

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Composant principal de l'application
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <MotionConfig reducedMotion="user">
                <Router>
                  <div className="App">
                    {/* Conteneur de notifications toast */}
                    <ToastContainer
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                        success: {
                          duration: 3000,
                          iconTheme: {
                            primary: '#22c55e',
                            secondary: '#fff',
                          },
                        },
                        error: {
                          duration: 5000,
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                          },
                        },
                      }}
                    />

                    {/* Routes de l'application */}
                    <Routes>
                      {/* Routes publiques avec layout principal */}
                      <Route path="/" element={<MainLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="products/:id" element={<ProductDetailPage />} />
                        <Route path="category" element={<CategoryPage />} />
                        <Route path="category/:slug" element={<CategoryPage />} />
                        <Route path="about" element={<AboutPage />} />
                        <Route path="contact" element={<ContactPage />} />
                        <Route path="cart" element={<CartPage />} />
                      </Route>

                      {/* Routes d'authentification avec layout spécifique */}
                      <Route path="/" element={<AuthLayout />}>
                        <Route 
                          path="login" 
                          element={
                            <AuthGuard requireAuth={false}>
                              <LoginPage />
                            </AuthGuard>
                          } 
                        />
                        <Route 
                          path="register" 
                          element={
                            <AuthGuard requireAuth={false}>
                              <RegisterPage />
                            </AuthGuard>
                          } 
                        />
                        <Route 
                          path="forgot-password" 
                          element={
                            <AuthGuard requireAuth={false}>
                              <ForgotPasswordPage />
                            </AuthGuard>
                          } 
                        />
                        <Route 
                          path="reset-password" 
                          element={
                            <AuthGuard requireAuth={false}>
                              <ResetPasswordPage />
                            </AuthGuard>
                          } 
                        />
                      </Route>

                      {/* Routes utilisateur authentifié */}
                      <Route 
                        path="/profile" 
                        element={
                          <AuthGuard>
                            <MainLayout />
                          </AuthGuard>
                        }
                      >
                        <Route index element={<ProfilePage />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="orders/:id" element={<OrderDetailPage />} />
                        <Route path="addresses" element={<AddressesPage />} />
                        <Route path="wishlist" element={<WishlistPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                      </Route>

                      {/* Routes checkout */}
                      <Route 
                        path="/checkout" 
                        element={
                          <AuthGuard>
                            <MainLayout />
                          </AuthGuard>
                        }
                      >
                        <Route index element={<CheckoutPage />} />
                        <Route path="shipping" element={<CheckoutShippingPage />} />
                        <Route path="payment" element={<CheckoutPaymentPage />} />
                        <Route path="confirmation" element={<CheckoutConfirmationPage />} />
                      </Route>

                      {/* Routes vendeur */}
                      <Route 
                        path="/dashboard/seller" 
                        element={
                          <AuthGuard>
                            <RoleGuard allowedRoles={[USER_ROLES.SELLER, USER_ROLES.ADMIN]}>
                              <DashboardLayout type="seller" />
                            </RoleGuard>
                          </AuthGuard>
                        }
                      >
                        <Route index element={<SellerDashboardPage />} />
                        <Route path="products" element={<SellerProductsPage />} />
                        <Route path="products/new" element={<SellerProductFormPage />} />
                        <Route path="products/:id/edit" element={<SellerProductFormPage />} />
                        <Route path="orders" element={<SellerOrdersPage />} />
                        <Route path="analytics" element={<SellerAnalyticsPage />} />
                      </Route>

                      {/* Routes admin */}
                      <Route 
                        path="/admin" 
                        element={
                          <AuthGuard>
                            <RoleGuard allowedRoles={[USER_ROLES.ADMIN]}>
                              <DashboardLayout type="admin" />
                            </RoleGuard>
                          </AuthGuard>
                        }
                      >
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="products" element={<AdminProductsPage />} />
                        <Route path="orders" element={<AdminOrdersPage />} />
                        <Route path="categories" element={<AdminCategoriesPage />} />
                        <Route path="analytics" element={<AdminAnalyticsPage />} />
                      </Route>

                      {/* Route 404 */}
                      <Route 
                        path="*" 
                        element={
                          <MainLayout>
                            <div className="min-h-screen flex items-center justify-center">
                              <div className="text-center">
                                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                                  404
                                </h1>
                                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                  Page non trouvée
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-8">
                                  La page que vous recherchez n'existe pas ou a été déplacée.
                                </p>
                                <a
                                  href="/"
                                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                                >
                                  Retour à l'accueil
                                </a>
                              </div>
                            </div>
                          </MainLayout>
                        } 
                      />
                    </Routes>
                  </div>
                </Router>
              </MotionConfig>
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>

      {/* React Query Devtools (seulement en développement) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

// Composant Error Boundary pour capturer les erreurs
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log l'erreur vers un service de monitoring
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Oups ! Quelque chose s'est mal passé
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Une erreur inattendue s'est produite. Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Rafraîchir la page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Retour à l'accueil
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                  Détails de l'erreur (développement)
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export avec Error Boundary
export default function AppWithErrorBoundary() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
