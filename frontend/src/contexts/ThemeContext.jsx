'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const [accentColor, setAccentColor] = useState('#FF6000') // Orange Buysell

  useEffect(() => {
    // Charger le thème depuis le localStorage
    const savedTheme = localStorage.getItem('buysell_theme')
    const savedAccentColor = localStorage.getItem('buysell_accent_color')
    
    if (savedTheme) {
      setTheme(savedTheme)
    }
    
    if (savedAccentColor) {
      setAccentColor(savedAccentColor)
    }

    // Détection automatique du thème système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      if (!localStorage.getItem('buysell_theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    // Appliquer le thème au document
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--orange', accentColor)
    document.documentElement.style.setProperty('--orange-dark', darkenColor(accentColor, 0.2))
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('buysell_theme', theme)
    localStorage.setItem('buysell_accent_color', accentColor)
  }, [theme, accentColor])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setCustomTheme = (newTheme, newAccentColor = null) => {
    setTheme(newTheme)
    if (newAccentColor) {
      setAccentColor(newAccentColor)
    }
  }

  const resetTheme = () => {
    setTheme('light')
    setAccentColor('#FF6000')
    localStorage.removeItem('buysell_theme')
    localStorage.removeItem('buysell_accent_color')
  }

  // Fonction utilitaire pour assombrir une couleur
  const darkenColor = (color, amount) => {
    const hex = color.replace('#', '')
    const num = parseInt(hex, 16)
    const amt = Math.round(2.55 * amount * 100)
    const R = (num >> 16) - amt
    const G = (num >> 8 & 0x00FF) - amt
    const B = (num & 0x0000FF) - amt
    return '#' + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1)
  }

  const value = {
    theme,
    accentColor,
    toggleTheme,
    setCustomTheme,
    resetTheme,
    setAccentColor,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
