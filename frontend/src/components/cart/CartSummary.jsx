'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export function CartSummary({ items, total, itemCount }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth();

  const shippingCost = total > 50 ? 0 : 4.99;
  const taxRate = 0.2; // 20% TVA
  const taxAmount = total * taxRate;
  const finalTotal = total + shippingCost + taxAmount;

  const handleCheckout = async () => {
    if (!user) {
      // Rediriger vers la page de connexion
      window.location.href = '/auth/login?redirect=/checkout';
      return;
    }

    setIsCheckingOut(true);
    try {
      // Ici vous pouvez ajouter la logique de checkout
      // Par exemple, créer une commande et rediriger vers Stripe
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Résumé de la commande</h2>
      </div>

      <div className="p-6 space-y-4">
        {/* Sous-total */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sous-total ({itemCount} articles)</span>
          <span className="text-gray-900">{total.toFixed(2)} €</span>
        </div>

        {/* Frais de livraison */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frais de livraison</span>
          <span className="text-gray-900">
            {shippingCost === 0 ? 'Gratuit' : `${shippingCost.toFixed(2)} €`}
          </span>
        </div>

        {/* Taxes */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">TVA (20%)</span>
          <span className="text-gray-900">{taxAmount.toFixed(2)} €</span>
        </div>

        {/* Livraison gratuite */}
        {total < 50 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800 text-center">
              Plus que <strong>{(50 - total).toFixed(2)} €</strong> pour la livraison gratuite !
            </p>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{finalTotal.toFixed(2)} €</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">TVA incluse</p>
        </div>

        {/* Bouton de checkout */}
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut || itemCount === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isCheckingOut ? 'Redirection...' : 'Passer la commande'}
        </button>

        {/* Liens de sécurité */}
        <div className="text-center text-xs text-gray-500 space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Paiement sécurisé SSL</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Livraison garantie</span>
          </div>
        </div>

        {/* Paiements acceptés */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 mb-2 text-center">Paiements acceptés</p>
          <div className="flex justify-center space-x-3">
            <div className="w-8 h-5 bg-gray-200 rounded"></div>
            <div className="w-8 h-5 bg-gray-200 rounded"></div>
            <div className="w-8 h-5 bg-gray-200 rounded"></div>
            <div className="w-8 h-5 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
