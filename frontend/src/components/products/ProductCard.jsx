'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';

export function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);
  const { addItem } = useCart();
  const { formatPrice, isMobile } = useApp();

  const mainImage = product.images?.[0] || '/images/placeholder.jpg';
  const price = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addItem(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-w-1 aspect-h-1 bg-gray-200 overflow-hidden">
          <Image
            src={imageError ? '/images/placeholder.jpg' : mainImage}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {product.isNew && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Nouveau
              </span>
            )}
            {product.salePrice && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                Promo
              </span>
            )}
            {product.stockQuantity === 0 && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                Rupture
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        {/* Catégorie */}
        {product.category && (
          <Link 
            href={`/products/category/${product.category.slug}`}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {product.category.name}
          </Link>
        )}

        {/* Nom du produit */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Note */}
        {product.rating > 0 && (
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Prix */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Bouton d'ajout au panier */}
        <button
          onClick={handleAddToCart}
          disabled={product.stockQuantity === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{product.stockQuantity === 0 ? 'Rupture' : 'Ajouter'}</span>
        </button>
      </div>
    </div>
  );
}
