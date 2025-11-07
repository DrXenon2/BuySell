'use client'
import { useState, useEffect } from 'react'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import Pagination from '@/components/ui/Pagination'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    category: '',
    priceRange: [0, 1000000],
    condition: '',
    rating: 0,
    sortBy: 'popular'
  })
  
  const productsPerPage = 12

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [products, filters])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Filtre par catégorie
    if (filters.category) {
      filtered = filtered.filter(product => 
        product.category?.slug === filters.category
      )
    }

    // Filtre par prix
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    )

    // Filtre par condition
    if (filters.condition) {
      filtered = filtered.filter(product => 
        product.condition === filters.condition
      )
    }

    // Filtre par rating
    if (filters.rating > 0) {
      filtered = filtered.filter(product => 
        product.rating >= filters.rating
      )
    }

    // Tri
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      default: // popular
        filtered.sort((a, b) => b.sold_count - a.sold_count)
    }

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--gray)' }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Chargement des produits...
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '20px 15px' }}>
        {/* En-tête */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: 'var(--dark)'
          }}>
            📦 Tous les Produits
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '16px' }}>
            Découvrez {filteredProducts.length} produits disponibles
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '250px 1fr', 
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Filtres */}
          <div>
            <ProductFilters 
              filters={filters}
              onFiltersChange={setFilters}
              productCount={filteredProducts.length}
            />
          </div>

          {/* Produits */}
          <div>
            {/* Barre de tri et résultats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </div>
              
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--gray-lighter)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="popular">Populaire</option>
                <option value="newest">Plus récent</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="rating">Meilleures notes</option>
              </select>
            </div>

            {/* Grille de produits */}
            {currentProducts.length > 0 ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {currentProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: 'var(--gray)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>
                  Aucun produit trouvé
                </h3>
                <p style={{ fontSize: '14px' }}>
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
