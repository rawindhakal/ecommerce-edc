export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'customer' | 'staff' | 'admin'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'online' | 'loyalty_points'
export type InventoryAction = 'restock' | 'sale' | 'adjustment' | 'return' | 'damaged'
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type TransactionType = 'earn' | 'redeem' | 'expire' | 'adjust'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  loyalty_tier: LoyaltyTier
  loyalty_points: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  sku: string | null
  barcode: string | null
  category_id: string | null
  price: number
  compare_at_price: number | null
  cost_price: number | null
  images: ProductImage[]
  tags: string[]
  is_active: boolean
  is_featured: boolean
  loyalty_points_reward: number
  weight_g: number | null
  ingredients: string | null
  how_to_use: string | null
  created_at: string
  updated_at: string
  category?: Category
  inventory?: Inventory
}

export interface ProductImage {
  url: string
  alt: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number | null
  options: Record<string, string>
  is_active: boolean
  created_at: string
}

export interface Inventory {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  reserved_quantity: number
  low_stock_threshold: number
  location: string
  updated_at: string
}

export interface InventoryTransaction {
  id: string
  product_id: string
  variant_id: string | null
  action: InventoryAction
  quantity_change: number
  quantity_before: number
  quantity_after: number
  notes: string | null
  reference_id: string | null
  performed_by: string | null
  created_at: string
  product?: Product
  performer?: Profile
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  status: OrderStatus
  subtotal: number
  discount_amount: number
  tax_amount: number
  shipping_amount: number
  total: number
  payment_method: PaymentMethod
  payment_status: string
  loyalty_points_used: number
  loyalty_points_earned: number
  shipping_address: ShippingAddress | null
  notes: string | null
  is_pos_order: boolean
  pos_session_id: string | null
  staff_id: string | null
  coupon_code: string | null
  created_at: string
  updated_at: string
  customer?: Profile
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_name: string | null
  sku: string | null
  quantity: number
  unit_price: number
  discount: number
  total: number
  created_at: string
  product?: Product
}

export interface ShippingAddress {
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface CartItem {
  id: string
  customer_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface LoyaltyTransaction {
  id: string
  customer_id: string
  order_id: string | null
  type: TransactionType
  points: number
  balance_after: number
  description: string | null
  expires_at: string | null
  created_at: string
}

export interface LoyaltyTierConfig {
  id: string
  tier: LoyaltyTier
  name: string
  min_points: number
  discount_percent: number
  points_multiplier: number
  free_shipping: boolean
  early_access: boolean
  birthday_bonus: number
  color: string
  icon: string
  benefits: string[]
}

export interface PosSession {
  id: string
  staff_id: string
  opening_cash: number
  closing_cash: number | null
  total_sales: number
  total_orders: number
  opened_at: string
  closed_at: string | null
  notes: string | null
  staff?: Profile
}

export interface Review {
  id: string
  product_id: string
  customer_id: string
  order_id: string | null
  rating: number
  title: string | null
  body: string | null
  is_verified: boolean
  is_published: boolean
  created_at: string
  customer?: Profile
}

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  minimum_order: number
  usage_limit: number | null
  used_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      inventory: { Row: Inventory; Insert: Partial<Inventory>; Update: Partial<Inventory> }
      inventory_transactions: { Row: InventoryTransaction; Insert: Partial<InventoryTransaction>; Update: Partial<InventoryTransaction> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> }
      cart_items: { Row: CartItem; Insert: Partial<CartItem>; Update: Partial<CartItem> }
      loyalty_transactions: { Row: LoyaltyTransaction; Insert: Partial<LoyaltyTransaction>; Update: Partial<LoyaltyTransaction> }
      loyalty_tiers_config: { Row: LoyaltyTierConfig; Insert: Partial<LoyaltyTierConfig>; Update: Partial<LoyaltyTierConfig> }
      pos_sessions: { Row: PosSession; Insert: Partial<PosSession>; Update: Partial<PosSession> }
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> }
      coupons: { Row: Coupon; Insert: Partial<Coupon>; Update: Partial<Coupon> }
    }
  }
}
