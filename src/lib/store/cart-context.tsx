'use client'
import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Product } from '@/types/supabase'

export interface CartItemLocal {
  product: Product
  quantity: number
  variantId?: string
  variantName?: string
}

interface CartState {
  items: CartItemLocal[]
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItemLocal }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE_CART' }
  | { type: 'LOAD'; payload: CartItemLocal[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex(i => i.product.id === action.payload.product.id)
      if (existing >= 0) {
        const items = [...state.items]
        items[existing] = { ...items[existing], quantity: items[existing].quantity + action.payload.quantity }
        return { ...state, items }
      }
      return { ...state, items: [...state.items, action.payload] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.product.id !== action.payload) }
    case 'UPDATE_QTY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter(i => i.product.id !== action.payload.productId) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === action.payload.productId ? { ...i, quantity: action.payload.quantity } : i
        ),
      }
    }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen }
    case 'LOAD':
      return { ...state, items: action.payload }
    default:
      return state
  }
}

interface CartContextValue extends CartState {
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false })

  useEffect(() => {
    const saved = localStorage.getItem('glowlux_cart')
    if (saved) {
      try { dispatch({ type: 'LOAD', payload: JSON.parse(saved) }) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('glowlux_cart', JSON.stringify(state.items))
  }, [state.items])

  const addItem = (product: Product, quantity = 1) =>
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
  const removeItem = (productId: string) => dispatch({ type: 'REMOVE_ITEM', payload: productId })
  const updateQty = (productId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QTY', payload: { productId, quantity } })
  const clearCart = () => dispatch({ type: 'CLEAR' })
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' })

  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = state.items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQty, clearCart, toggleCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
