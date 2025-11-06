'use client';

import { useState } from 'react';
import { useCart } from '../../hooks/useCart';

export function AddToCart({ 
  product, 
  variant = 'default',
  showQuantity = true,
  onAdd 
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  
  const { addItem, getItemQuantity } = useCart();

  // Options du produit (couleur, taille, etc.)
  const productOptions = product.variants || [];

  const currentQuantity = getItemQuantity(product.id, selectedOptions);
  const availableStock = product.stockQuantity - currentQuantity;
  const canAddToCart = availableStock > 0 && quantity <= availableStock;

  const handleAddToCart = async () => {
    if (!canAddToCart) return;

    setIsAdding(true);
    
    try {
      await addItem(product, quantity, selectedOptions);
      
      // Callback après ajout réussi
      if (onAdd) {
        onAdd({ product, quantity, options: selectedOptions });
      }

      // Réinitialiser la quantité après ajout (optionnel)
      if (variant === 'default') {
        setQuantity(1);
      }

      // Animation de succès
      // Vous pouvez ajouter une notification toast ici

    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleOptionChange = (optionName, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  // Variants du composant
  const variants = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3',
    compact: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3'
  };

  return (
    <div className="space-y-4">
      {/* Sélecteur d'options */}
      {productOptions.length > 0 && (
        <div className="space-y-3">
          {productOptions.map((option) => (
            <div key={option.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {option.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleOptionChange(option.name, value)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                      selectedOptions[option.name] === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contrôles de quantité et bouton */}
      <div className={`flex items-center ${showQuantity ? 'space-x-4' : ''}`}>
        {showQuantity && (
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            
            <span className="px-3 py-2 text-gray-900 min-w-12 text-center">
              {quantity}
            </span>
            
            <button
              type="button"
              onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
              disabled={quantity >= availableStock}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart || isAdding}
          className={`flex-1 ${variants[variant]} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          {isAdding ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ajout en cours...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {!canAddToCart ? 'Rupture de stock' : `Ajouter au panier ${showQuantity ? `· ${quantity}` : ''}`}
            </>
          )}
        </button>
      </div>

      {/* Informations de stock */}
      <div className="text-sm text-gray-600 space-y-1">
        {currentQuantity > 0 && (
          <p>
            Déjà <strong>{currentQuantity}</strong> dans votre panier
          </p>
        )}
        
        {availableStock > 0 ? (
          <p>
            <strong>{availableStock}</strong> disponible(s) en stock
          </p>
        ) : (
          <p className="text-red-600">Rupture de stock</p>
        )}

        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
          <p className="text-orange-600">Stock limité !</p>
        )}
      </div>
    </div>
  );
}
