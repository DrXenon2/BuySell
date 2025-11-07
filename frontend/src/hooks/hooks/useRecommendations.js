'use client'
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState({})
  const { user } = useAuth()

  const getPersonalizedSuggestions = async () => {
    try {
      const response = await fetch('/api/recommendations/personalized', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data)
      }
    } catch (error) {
      // Fallback aux suggestions générales
      getGeneralSuggestions()
    }
  }

  const getGeneralSuggestions = async () => {
    try {
      const [trending, categories, popular] = await Promise.all([
        fetch('/api/products/trending').then(r => r.json()),
        fetch('/api/categories/popular').then(r => r.json()),
        fetch('/api/products/popular').then(r => r.json())
      ])

      setRecommendations({
        trending: trending.products || [],
        categories: categories.categories || [],
        popular: popular.products || []
      })
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  useEffect(() => {
    if (user) {
      getPersonalizedSuggestions()
    } else {
      getGeneralSuggestions()
    }
  }, [user])

  return { recommendations }
}
