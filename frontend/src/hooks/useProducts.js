'use client'
import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'

export function useProducts() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [officialStoreProducts, setOfficialStoreProducts] = useState([])
  const [djassaProducts, setDjassaProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadHomepageData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [featured, official, djassa] = await Promise.all([
        apiService.getFeaturedProducts(),
        apiService.getOfficialStoreProducts(),
        apiService.getDjassaProducts()
      ])
      
      setFeaturedProducts(featured.products || [])
      setOfficialStoreProducts(official.products || [])
      setDjassaProducts(djassa.products || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading homepage data:', err)
      
      // Fallback data
      setFeaturedProducts(getFallbackProducts().filter(p => p.isFeatured))
      setOfficialStoreProducts(getFallbackProducts().filter(p => p.isOfficial))
      setDjassaProducts(getFallbackProducts().filter(p => p.isSecondHand))
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async (query, filters = {}) => {
    setLoading(true)
    try {
      const response = await apiService.getProducts({
        search: query,
        ...filters
      })
      return response.products
    } catch (err) {
      setError(err.message)
      return getFallbackProducts()
    } finally {
      setLoading(false)
    }
  }

  const getProduct = async (id) => {
    try {
      return await apiService.getProduct(id)
    } catch (err) {
      setError(err.message)
      return getFallbackProducts().find(p => p.id === id) || null
    }
  }

  const getProductsByCategory = async (categorySlug) => {
    try {
      const response = await apiService.getProducts({ category: categorySlug })
      return response.products
    } catch (err) {
      setError(err.message)
      return getFallbackProducts().filter(p => p.category?.slug === categorySlug)
    }
  }

  return {
    featuredProducts,
    officialStoreProducts,
    djassaProducts,
    loading,
    error,
    loadHomepageData,
    searchProducts,
    getProduct,
    getProductsByCategory
  }
}

// Données de fallback pour le développement
function getFallbackProducts() {
  return [
    {
      id: '1',
      name: "Samsung Galaxy S24 Ultra 5G 512GB - Double SIM - Garantie 2 Ans",
      price: 749000,
      original_price: 899000,
      images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop"],
      category: { name: "Téléphonie", slug: "electronics" },
      brand: "Samsung",
      condition: "new",
      stock_quantity: 15,
      rating: 4.8,
      review_count: 2451,
      is_second_hand: false,
      is_featured: true,
      is_official: true,
      sold_count: 124,
      seller: {
        name: "Samsung Store",
        verified: true,
        rating: 4.9
      }
    },
    {
      id: '2',
      name: "iPhone 15 Pro Max 1TB - Titanium Naturel - Garantie Apple",
      price: 1150000,
      original_price: 1299000,
      images: ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop"],
      category: { name: "Téléphonie", slug: "electronics" },
      brand: "Apple",
      condition: "new",
      stock_quantity: 8,
      rating: 4.9,
      review_count: 1892,
      is_second_hand: false,
      is_featured: true,
      is_official: true,
      sold_count: 89,
      seller: {
        name: "Apple Authorized",
        verified: true,
        rating: 4.9
      }
    },
    {
      id: '3',
      name: "MacBook Air M3 15\" 2024 - 16GB/512GB - Édition Limitée",
      price: 1249000,
      original_price: 1399000,
      images: ["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop"],
      category: { name: "Informatique", slug: "electronics" },
      brand: "Apple",
      condition: "new",
      stock_quantity: 12,
      rating: 4.7,
      review_count: 892,
      is_second_hand: false,
      is_featured: true,
      is_official: true,
      sold_count: 45,
      seller: {
        name: "Apple Authorized",
        verified: true,
        rating: 4.9
      }
    },
    {
      id: '4',
      name: "Nike Air Jordan 1 Retro High OG - Taille 42 - État impeccable",
      price: 65000,
      original_price: 120000,
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop"],
      category: { name: "Mode", slug: "fashion" },
      brand: "Nike",
      condition: "used",
      stock_quantity: 1,
      rating: 4.5,
      review_count: 23,
      is_second_hand: true,
      is_featured: false,
      is_official: false,
      sold_count: 0,
      seller: {
        name: "SneakerHead CI",
        verified: true,
        rating: 4.8
      }
    },
    {
      id: '5',
      name: "Canapé 3 places en cuir - Style contemporain - Livraison incluse",
      price: 285000,
      original_price: 350000,
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop"],
      category: { name: "Maison", slug: "home" },
      brand: "Maison & Deco",
      condition: "new",
      stock_quantity: 5,
      rating: 4.6,
      review_count: 156,
      is_second_hand: false,
      is_featured: true,
      is_official: false,
      sold_count: 12,
      seller: {
        name: "Déco Plus",
        verified: true,
        rating: 4.7
      }
    }
  ]
}
