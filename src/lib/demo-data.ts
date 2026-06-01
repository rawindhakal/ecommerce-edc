import type { Product, Category } from '@/types/supabase'

/**
 * Demo fallback data — used when Supabase returns no rows (e.g. before the
 * database is seeded). Keeps the storefront looking populated and dynamic.
 * Prices are in NPR.
 */

export const DEMO_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Skincare',  slug: 'skincare',  description: 'Nourish & glow',          image_url: null, parent_id: null, display_order: 1, is_active: true, created_at: '' },
  { id: 'c2', name: 'Makeup',    slug: 'makeup',    description: 'Express your beauty',      image_url: null, parent_id: null, display_order: 2, is_active: true, created_at: '' },
  { id: 'c3', name: 'Fragrance', slug: 'fragrance', description: 'Signature scents',         image_url: null, parent_id: null, display_order: 3, is_active: true, created_at: '' },
  { id: 'c4', name: 'Hair Care', slug: 'hair-care', description: 'Salon-quality care',       image_url: null, parent_id: null, display_order: 4, is_active: true, created_at: '' },
  { id: 'c5', name: 'Body Care', slug: 'body-care', description: 'Indulgent rituals',        image_url: null, parent_id: null, display_order: 5, is_active: true, created_at: '' },
  { id: 'c6', name: 'Tools',     slug: 'tools',     description: 'Beauty essentials',        image_url: null, parent_id: null, display_order: 6, is_active: true, created_at: '' },
]

function demoProduct(p: Partial<Product> & { id: string; name: string; slug: string; price: number; categorySlug: string; categoryName: string; image: string }): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? 'A luxurious beauty essential crafted with premium ingredients for radiant, healthy results.',
    short_description: p.short_description ?? null,
    sku: p.sku ?? null,
    barcode: null,
    category_id: null,
    price: p.price,
    compare_at_price: p.compare_at_price ?? null,
    cost_price: null,
    images: [{ url: p.image, alt: p.name }],
    tags: p.tags ?? [],
    is_active: true,
    is_featured: p.is_featured ?? false,
    loyalty_points_reward: p.loyalty_points_reward ?? Math.round(p.price / 100),
    weight_g: null,
    ingredients: null,
    how_to_use: null,
    created_at: '',
    updated_at: '',
    category: { id: '', name: p.categoryName, slug: p.categorySlug } as Category,
  }
}

export const DEMO_PRODUCTS: Product[] = [
  demoProduct({ id: 'p1', name: 'Rose Petal Glow Serum', slug: 'rose-petal-glow-serum', price: 2450, compare_at_price: 3200, is_featured: true, categorySlug: 'skincare', categoryName: 'Skincare', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', tags: ['serum', 'brightening', 'vitamin-c'] }),
  demoProduct({ id: 'p2', name: 'Velvet Matte Lipstick — Blush', slug: 'velvet-matte-lipstick-blush', price: 1290, compare_at_price: 1600, is_featured: true, categorySlug: 'makeup', categoryName: 'Makeup', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', tags: ['lipstick', 'matte', 'long-lasting'] }),
  demoProduct({ id: 'p3', name: 'Pink Bloom Eau de Parfum', slug: 'pink-bloom-eau-de-parfum', price: 5800, compare_at_price: 7000, is_featured: true, categorySlug: 'fragrance', categoryName: 'Fragrance', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600', tags: ['floral', 'rose', 'luxury'] }),
  demoProduct({ id: 'p4', name: 'Hydra-Dew Moisturizer', slug: 'hydra-dew-moisturizer', price: 1950, compare_at_price: 2400, is_featured: true, categorySlug: 'skincare', categoryName: 'Skincare', image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600', tags: ['moisturizer', 'hydrating'] }),
  demoProduct({ id: 'p5', name: 'Silk Glow Foundation', slug: 'silk-glow-foundation', price: 2100, compare_at_price: 2600, is_featured: true, categorySlug: 'makeup', categoryName: 'Makeup', image: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=600', tags: ['foundation', 'spf', 'luminous'] }),
  demoProduct({ id: 'p6', name: 'Repair & Shine Hair Mask', slug: 'repair-shine-hair-mask', price: 1680, is_featured: true, categorySlug: 'hair-care', categoryName: 'Hair Care', image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600', tags: ['hair-mask', 'keratin'] }),
  demoProduct({ id: 'p7', name: 'Rose Quartz Facial Roller', slug: 'rose-quartz-facial-roller', price: 1450, compare_at_price: 1900, is_featured: true, categorySlug: 'tools', categoryName: 'Tools', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', tags: ['roller', 'de-puffing'] }),
  demoProduct({ id: 'p8', name: 'Vanilla Bloom Body Butter', slug: 'vanilla-bloom-body-butter', price: 1320, is_featured: true, categorySlug: 'body-care', categoryName: 'Body Care', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600', tags: ['body-butter', 'shea'] }),
  demoProduct({ id: 'p9', name: 'Petal Blush Palette', slug: 'petal-blush-palette', price: 2890, compare_at_price: 3500, categorySlug: 'makeup', categoryName: 'Makeup', image: 'https://images.unsplash.com/photo-1583241800698-e8ab01c85d49?w=600', tags: ['blush', 'palette'] }),
  demoProduct({ id: 'p10', name: 'Niacinamide Clarity Drops', slug: 'niacinamide-clarity-drops', price: 1750, categorySlug: 'skincare', categoryName: 'Skincare', image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600', tags: ['serum', 'pore-refining'] }),
  demoProduct({ id: 'p11', name: 'Cherry Gloss Lip Oil', slug: 'cherry-gloss-lip-oil', price: 980, compare_at_price: 1250, categorySlug: 'makeup', categoryName: 'Makeup', image: 'https://images.unsplash.com/photo-1599733589046-75c9c5f0e2e9?w=600', tags: ['lip-oil', 'gloss'] }),
  demoProduct({ id: 'p12', name: 'Midnight Rose Body Mist', slug: 'midnight-rose-body-mist', price: 1490, categorySlug: 'fragrance', categoryName: 'Fragrance', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600', tags: ['body-mist', 'rose'] }),
]

export function getDemoProducts(filter?: { featured?: boolean; category?: string }): Product[] {
  let list = DEMO_PRODUCTS
  if (filter?.featured) list = list.filter(p => p.is_featured)
  if (filter?.category) list = list.filter(p => p.category?.slug === filter.category)
  return list
}
