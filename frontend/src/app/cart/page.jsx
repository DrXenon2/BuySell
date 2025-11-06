'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../../../hooks/useCart';
import { CartItem } from '../../../components/cart/CartItem';
import { CartSummary } from '../../../components/cart/CartSummary';
import { EmptyCart } from '../../../components/cart/EmptyCart';

export default function CartPage() {
  const { 
    items, 
    total, 
    itemCount, 
    updateQuantity, 
    removeItem, 
    clearCart,
    isLoading 
  } = useCart();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isClient || itemCount === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Panier</h1>
          <p className="text-gray-600 mt-2">
            {itemCount} {itemCount > 1 ? 'articles' : 'article'} dans votre panier
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Liste des articles */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>

              {/* Actions du panier */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Vider le panier
                  </button>
                  
                  <Link
                    href="/products"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    ← Continuer mes achats
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé et checkout */}
          <div className="mt-8 lg:mt-0 lg:col-span-5">
            <CartSummary 
              items={items}
              total={total}
              itemCount={itemCount}
            />
          </div>
        </div>

        {/* Produits recommandés */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Produits fréquemment achetés ensemble
          </h2>
          {/* Ici vous pouvez ajouter un composant de produits recommandés */}
        </section>
      </div>
    </div>
  );
}
