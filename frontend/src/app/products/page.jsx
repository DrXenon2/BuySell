'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { useApp } from '../../contexts/AppContext';
import { ProductGrid } from '../../components/products/ProductGrid';
import { ProductFilters } from '../../components/products/ProductFilters';
import { ProductSort } from '../../components/products/ProductSort';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function ProductsPage() {
  const { 
    results: products, 
    isLoading, 
    pagination, 
    setPage,
    search,
    filters,
    setFilters,
    query
  } = useSearch();

  const { isMobile, toggleSidebar, setPageTitle, setBreadcrumbs } = useApp();

  // État local pour les filtres
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setPageTitle('Catalogue des Produits');
    setBreadcrumbs([
      { label: 'Accueil', href: '/' },
      { label: 'Produits', href: '/products' }
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  // Appliquer les filtres avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (JSON.stringify(localFilters) !== JSON.stringify(filters)) {
        setFilters(localFilters);
        search(query, localFilters, 1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localFilters, filters, setFilters, search, query]);

  const handleFilterChange = (newFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <LoadingSpinner size="large" message="Chargement des produits..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Catalogue des Produits
              </h1>
              {query && (
                <p className="text-gray-600 mt-2">
                  Résultats pour : <span className="font-semibold">"{query}"</span>
                </p>
              )}
              {pagination.total > 0 && (
                <p className="text-gray-600 mt-1">
                  {pagination.total} produit(s) trouvé(s)
                </p>
              )}
            </div>

            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              {/* Bouton filtres mobile */}
              {isMobile && (
                <button
                  onClick={() => toggleSidebar('filters')}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtres
                </button>
              )}

              {/* Tri des produits */}
              <ProductSort
                sortBy={localFilters.sortBy}
                sortOrder={localFilters.sortOrder}
                onChange={(sort) => handleFilterChange(sort)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar des filtres (Desktop) */}
          {!isMobile && (
            <div className="lg:w-64 flex-shrink-0">
              <ProductFilters
                filters={localFilters}
                onChange={handleFilterChange}
              />
            </div>
          )}

          {/* Contenu principal */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {query 
                    ? 'Essayez de modifier vos critères de recherche ou vos filtres.'
                    : 'Aucun produit disponible pour le moment.'
                  }
                </p>
                {query && (
                  <button
                    onClick={() => window.location.href = '/products'}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Voir tous les produits
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Grille de produits */}
                <ProductGrid products={products} />

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
