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
      return []
    } finally {
      setLoading(false)
    }
  }

  const getProduct = async (id) => {
    try {
      return await apiService.getProduct(id)
    } catch (err) {
      setError(err.message)
      return null
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
    getProduct
  }
}
