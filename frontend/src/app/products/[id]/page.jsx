'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import { AddToCart } from '../../../components/cart/AddToCart';
import { ProductImages } from '../../../components/products/ProductImages';
import { ProductInfo } from '../../../components/products/ProductInfo';
import { ProductSpecifications } from '../../../components/products/ProductSpecifications';
import { ProductReviews } from '../../../components/products/ProductReviews';
import { RelatedProducts } from '../../../components/products/RelatedProducts';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { setPageTitle, setBreadcrumbs, formatPrice } = useApp();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      setPageTitle(product.name);
      setBreadcrumbs([
        { label: 'Accueil', href: '/' },
        { label: 'Produits', href: '/products' },
        { label: product.category?.name || 'Catégorie', href: `/products?category=${product.category?.id}` },
        { label: product.name, href: `/products/${product.id}` }
      ]);
    }
  }, [product, setPageTitle, setBreadcrumbs]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Produit non trouvé');
      }

      setProduct(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (quantity, options = {}) => {
    if (!product) return;

    try {
      await addItem(product, quantity, options);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <LoadingSpinner size="large" message="Chargement du produit..." />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Produit non trouvé'}
            </h3>
            <p className="text-gray-600 mb-6">
              Le produit que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              ← Retour aux produits
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation rapide */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={() => router.push('/products')} className="hover:text-gray-900">
            Produits
          </button>
          <span>→</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Galerie d'images */}
            <div>
              <ProductImages images={product.images} productName={product.name} />
            </div>

            {/* Informations du produit */}
            <div className="space-y-6">
              <ProductInfo product={product} />
              
              {/* Ajout au panier */}
              <div className="border-t border-gray-200 pt-6">
                <AddToCart
                  product={product}
                  onAdd={handleAddToCart}
                  variant="default"
                  showQuantity={true}
                />
              </div>

              {/* Informations supplémentaires */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    En stock
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Paiement sécurisé
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Livraison gratuite
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retours sous 30 jours
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs détaillées */}
          <div className="border-t border-gray-200">
            <div className="px-8">
              <nav className="flex space-x-8">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'specifications', label: 'Spécifications' },
                  { id: 'reviews', label: `Avis (${product.reviewCount || 0})` },
                  { id: 'shipping', label: 'Livraison' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="px-8 py-6">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  
                  {product.features && product.features.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Caractéristiques principales</h4>
                      <ul className="space-y-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <ProductSpecifications specifications={product.specifications} />
              )}

              {activeTab === 'reviews' && (
                <ProductReviews 
                  productId={product.id}
                  reviews={product.reviews}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Livraison et retours</h3>
                  <div className="grid gap-4 text-sm text-gray-700">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span>Livraison standard</span>
                      <span className="font-medium">Gratuite</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span>Livraison express</span>
                      <span className="font-medium">4,99 €</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span>Délai de livraison</span>
                      <span className="font-medium">2-5 jours ouvrés</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Retours acceptés</span>
                      <span className="font-medium text-green-600">Sous 30 jours</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Produits similaires */}
        <RelatedProducts 
          productId={product.id}
          categoryId={product.categoryId}
          className="mt-12"
        />
      </div>
    </div>
  );
}
