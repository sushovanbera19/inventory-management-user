// Contexts of the shop and their hooks: signed-in customer, cart, wishlist and theme.
import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
export const CartContext = createContext(null)
export const WishlistContext = createContext(null)
export const ThemeContext = createContext(null)

function need(value, name) {
  if (!value) throw new Error(`${name} must be used inside its provider.`)
  return value
}

/** { user, isAuthenticated, isLoading, login, register, logout, setUser } */
export const useAuth = () => need(useContext(AuthContext), 'useAuth')

/** { items, count, subtotal, add(product, qty), update(productId, qty), remove(productId), clear(), isOpen, open(), close() } */
export const useCart = () => need(useContext(CartContext), 'useCart')

/** { ids, has(id), toggle(product), remove(id) } */
export const useWishlist = () => need(useContext(WishlistContext), 'useWishlist')

/** { dark, toggle(event) } */
export const useTheme = () => need(useContext(ThemeContext), 'useTheme')
