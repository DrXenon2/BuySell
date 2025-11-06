'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../hooks/useCart';

export function CartButton({ variant = 'default' }) {
  const { itemCount } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    default: 'text-gray-700 hover:text-blue-600',
    light: 'text-white hover:text-blue-200'
  };

  return (
    <Link
      href="/cart"
      className={`relative p-2 transition-colors ${variants[variant]}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icône panier */}
      <svg 
        className="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21m-7.5-2.5h9M17 21v-4a2 2 0 00-2-2h-2" 
        />
      </svg>

      {/* Badge avec le nombre d'articles */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}

      {/* Tooltip au hover */}
      {isHovered && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
          <div className="text-sm font-medium text-gray-900">
            Votre panier
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {itemCount === 0 
              ? 'Votre panier est vide' 
              : `${itemCount} article(s)`
            }
          </div>
          {itemCount > 0 && (
            <Link
              href="/cart"
              className="block w-full mt-2 bg-blue-600 text-white text-center py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Voir le panier
            </Link>
          )}
        </div>
      )}
    </Link>
  );
}
