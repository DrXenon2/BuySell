'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function CartItem({ item, onUpdateQuantity, onRemove }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const price = item.salePrice || item.price;
  const totalPrice = price * item.quantity;

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > item.maxQuantity) return;

    setIsUpdating(true);
    setQuantity(newQuantity);

    try {
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setQuantity(item.quantity); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  const incrementQuantity = () => handleQuantityChange(quantity + 1);
  const decrementQuantity = () => handleQuantityChange(quantity - 1);

  return (
    <div className="flex items-center p-6 hover:bg-gray-50 transition-colors">
      {/* Image du produit */}
      <div className="flex-shrink-0">
        <Link href={`/products/${item.slug || item.productId}`}>
          <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={item.image}
              alt={item.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      </div>

      {/* Informations du produit */}
      <div className="ml-6 flex-1 min-w-0">
        <Link href={`/products/${item.slug || item.productId}`}>
          <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
            {item.name}
          </h3>
        </Link>

        {/* Options du produit */}
        {item.options && Object.keys(item.options).length > 0 && (
          <div className="mt-1 text-sm text-gray-500">
            {Object.entries(item.options).map(([key, value]) => (
              <span key={key} className="mr-3">
                {key}: <strong>{value}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Prix */}
        <div className="mt-2 flex items-center">
          <span className="text-lg font-semibold text-gray-900">
            {price.toFixed(2)} €
          </span>
          {item.salePrice && item.salePrice < item.price && (
            <span className="ml-2 text-sm text-gray-500 line-through">
              {item.price.toFixed(2)} €
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="mt-1 text-sm text-gray-500">
          {item.stockQuantity > 0 ? (
            <span className="text-green-600">En stock</span>
          ) : (
            <span className="text-red-600">Rupture de stock</span>
          )}
        </div>
      </div>

      {/* Contrôles de quantité et actions */}
      <div className="flex items-center space-x-4">
        {/* Sélecteur de quantité */}
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={decrementQuantity}
            disabled={quantity <= 1 || isUpdating}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            −
          </button>
          
          <span className="px-3 py-1 text-gray-900 min-w-12 text-center">
            {isUpdating ? '...' : quantity}
          </span>
          
          <button
            onClick={incrementQuantity}
            disabled={quantity >= item.maxQuantity || isUpdating}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>

        {/* Prix total */}
        <div className="text-right min-w-24">
          <div className="text-lg font-semibold text-gray-900">
            {totalPrice.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-500">
            {quantity} × {price.toFixed(2)} €
          </div>
        </div>

        {/* Bouton supprimer */}
        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 p-2 transition-colors"
          title="Supprimer du panier"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
