'use client'
import { AuthProvider } from './AuthContext'
import { CartProvider } from './CartContext'
import { NotificationProvider } from './NotificationContext'
import { SearchProvider } from './SearchContext'
import { ThemeProvider } from './ThemeContext'
import { UserProvider } from './UserContext'
import { AppProvider } from './AppContext'
import { CategoryProvider } from './CategoryContext'
import { SecondHandProvider } from './SecondHandContext'

export function AllProviders({ children }) {
  return (
    <AppProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SearchProvider>
              <UserProvider>
                <CategoryProvider>
                  <SecondHandProvider>
                    <CartProvider>
                      {children}
                    </CartProvider>
                  </SecondHandProvider>
                </CategoryProvider>
              </UserProvider>
            </SearchProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Export de tous les hooks pour un import facile
export { useAuth } from './AuthContext'
export { useCart } from './CartContext'
export { useNotification } from './NotificationContext'
export { useSearch } from './SearchContext'
export { useTheme } from './ThemeContext'
export { useUser } from './UserContext'
export { useApp } from './AppContext'
export { useCategory } from './CategoryContext'
export { useSecondHand } from './SecondHandContext'
