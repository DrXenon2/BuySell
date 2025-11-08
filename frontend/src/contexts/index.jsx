'use client'
import { AuthProvider } from './AuthContext'
import { CartProvider } from './CartContext'
import { NotificationProvider } from './NotificationContext'
import { SearchProvider } from './SearchContext'
import { ThemeProvider } from './ThemeContext'
import { UserProvider } from './UserContext'
import { AppProvider } from './AppContext'

export function AllProviders({ children }) {
  return (
    <AppProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SearchProvider>
              <UserProvider>
                <CartProvider>
                  {children}
                </CartProvider>
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
