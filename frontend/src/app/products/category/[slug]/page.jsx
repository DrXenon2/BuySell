'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSearch } from '../../../../contexts/SearchContext';
import { useApp } from '../../../../contexts/AppContext';
import { ProductGrid } from '../../../../components/products/ProductGrid';
import { ProductFilters } from '../../../../components/products/ProductFilters';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params;

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    results: products, 
    isLoading, 
    pagination,
    setPage,
    setFilters,
    search
  } = useSearch();

  const { isMobile, setPageTitle, setBreadcrumbs } = useApp();

  useEffect(() => {
    fetchCategory();
  }, [slug]);

  useEffect(() => {
    if (category) {
      setPageTitle(category.name);
      setBreadcrumbs([
        { label: 'Accueil', href: '/' },
        { label: 'Produits', href: '/products' },
        { label: category.name, href: `/products/category/${category.slug}` }
      ]);

      // Configurer la recherche pour cette catégorie
      setFilters({ category: category.id });
      search('', { category: category.id }, 1);
    }
  }, [category, setPageTitle, setBreadcrumbs, setFilters, search]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/categories/${slug}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error('Catégorie non trouvée');
      }

      setCategory(data.data);
    } catch (error) {
      console.error('Error fetching category:', error);
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <LoadingSpinner size="large" message="Chargement de la catégorie..." />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Catégorie non trouvée
            </h3>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Retour aux produits
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la catégorie */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            {category.image && (
              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
            {pagination.total > 0 && (
              <p className="text-gray-500 mt-2">
                {pagination.total} produit(s) dans cette catégorie
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtres */}
          {!isMobile && (
            <div className="lg:w-64 flex-shrink-0">
              <ProductFilters
                filters={{ category: category.id }}
                onChange={(newFilters) => {
                  setFilters({ ...newFilters, category: category.id });
                  search('', { ...newFilters, category: category.id }, 1);
                }}
              />
            </div>
          )}

          {/* Produits */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun produit dans cette catégorie
                </h3>
                <p className="text-gray-600">
                  Revenez plus tard pour découvrir de nouveaux produits.
                </p>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex space-x-2">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPage(page)}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            page === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
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
