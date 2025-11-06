'use client';

import Link from 'next/link';

export function EmptyCart() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Icône */}
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21m-7.5-2.5h9M17 21v-4a2 2 0 00-2-2h-2" />
          </svg>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Votre panier est vide
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Découvrez nos produits et trouvez ce qui vous plaît. 
          Une fois que vous aurez ajouté des articles, ils apparaîtront ici.
        </p>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Découvrir nos produits
          </Link>

          <Link
            href="/categories"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Parcourir les catégories
          </Link>
        </div>

        {/* Produits populaires suggérés */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Produits populaires
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ces produits pourraient être chargés dynamiquement */}
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
                <h3 className="font-medium text-gray-900 mb-2">Produit populaire {item}</h3>
                <p className="text-gray-600 text-sm mb-3">À partir de 29,99 €</p>
                <Link
                  href={`/products/product-${item}`}
                  className="inline-block px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Voir le produit →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
