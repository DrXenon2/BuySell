'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const ThemeContext = createContext();

// Types d'actions
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME'
};

// Thèmes disponibles
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// État initial
const initialState = {
  theme: THEMES.LIGHT,
  systemTheme: THEMES.LIGHT,
  isDark: false,
  themes: Object.values(THEMES)
};

// Reducer
function themeReducer(state, action) {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      const newTheme = action.payload;
      const isDark = newTheme === THEMES.DARK || 
                    (newTheme === THEMES.SYSTEM && state.systemTheme === THEMES.DARK);
      
      return {
        ...state,
        theme: newTheme,
        isDark
      };

    case THEME_ACTIONS.TOGGLE_THEME:
      const currentTheme = state.theme;
      let nextTheme;
      
      if (currentTheme === THEMES.LIGHT) {
        nextTheme = THEMES.DARK;
      } else if (currentTheme === THEMES.DARK) {
        nextTheme = THEMES.SYSTEM;
      } else {
        nextTheme = THEMES.LIGHT;
      }
      
      const isDarkAfterToggle = nextTheme === THEMES.DARK || 
                               (nextTheme === THEMES.SYSTEM && state.systemTheme === THEMES.DARK);
      
      return {
        ...state,
        theme: nextTheme,
        isDark: isDarkAfterToggle
      };

    case THEME_ACTIONS.SET_SYSTEM_THEME:
      const systemIsDark = action.payload === THEMES.DARK;
      const effectiveIsDark = state.theme === THEMES.DARK || 
                             (state.theme === THEMES.SYSTEM && systemIsDark);
      
      return {
        ...state,
        systemTheme: action.payload,
        isDark: effectiveIsDark
      };

    default:
      return state;
  }
}

// Hook personnalisé
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Provider
export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Détection du thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const systemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      dispatch({ 
        type: THEME_ACTIONS.SET_SYSTEM_THEME, 
        payload: systemTheme 
      });
    };

    // Définir le thème système initial
    handleSystemThemeChange(mediaQuery);

    // Écouter les changements
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Charger le thème sauvegardé
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Appliquer le thème au document
  useEffect(() => {
    const root = window.document.documentElement;

    // Supprimer les classes de thème précédentes
    root.classList.remove('light', 'dark');

    // Appliquer le thème actuel
    if (state.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Sauvegarder le thème
    localStorage.setItem('theme', state.theme);
  }, [state.theme, state.isDark]);

  // Actions
  const setTheme = (theme) => {
    if (!Object.values(THEMES).includes(theme)) {
      console.warn(`Thème invalide: ${theme}`);
      return;
    }
    
    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: theme });
  };

  const toggleTheme = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_THEME });
  };

  const value = {
    // State
    ...state,

    // Actions
    setTheme,
    toggleTheme,

    // Méthodes utilitaires
    getThemeClass: (lightClass, darkClass) => 
      state.isDark ? darkClass : lightClass,
    
    getThemeColor: (lightColor, darkColor) => 
      state.isDark ? darkColor : lightColor
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Composant pour forcer le thème (utile pour les tests)
export function ThemeWrapper({ children }) {
  const { isDark } = useTheme();
  
  return (
    <div className={isDark ? 'dark-theme' : 'light-theme'}>
      {children}
    </div>
  );
}
