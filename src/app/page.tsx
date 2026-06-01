import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Shield, Leaf, Star, Zap, Gift, ChevronRight, Quote, Truck, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ProductCard from '@/components/store/product-card'
import Navbar from '@/components/store/navbar'
import Footer from '@/components/store/footer'
import BrandName from '@/components/brand-name'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CATEGORIES, getDemoProducts } from '@/lib/demo-data'
import type { Product, Category } from '@/types/supabase'

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(name, slug)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(8)
    if (data && data.length > 0) return data as Product[]
  } catch {}
  return getDemoProducts({ featured: true })
}

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order')
    if (data && data.length > 0) return data
  } catch {}
  return DEMO_CATEGORIES
}

const categoryImages: Record<string, string> = {
  skincare: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
  makeup: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500',
  fragrance: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500',
  'hair-care': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500',
  'body-care': 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500',
  tools: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
}

const values = [
  { icon: Leaf, title: 'Clean Beauty', desc: 'Cruelty-free, vegan formulas without harsh chemicals.' },
  { icon: Shield, title: 'Derm Tested', desc: 'Clinically tested for safety, gentleness, and efficacy.' },
  { icon: Truck, title: 'Free Delivery', desc: 'Complimentary shipping on all orders above Rs. 1,000.' },
  { icon: Gift, title: 'Glow Rewards', desc: 'Earn points on every order, redeem for exclusive perks.' },
]

const testimonials = [
  { name: 'Aarya S.', role: 'Verified Buyer', text: 'The Rose Petal Serum completely transformed my skin. I glow every single morning now!', rating: 5 },
  { name: 'Priya M.', role: 'Verified Buyer', text: 'Obsessed with the Pink Bloom perfume. Long-lasting, elegant, and everyone asks what I\'m wearing.', rating: 5 },
  { name: 'Sneha K.', role: 'Verified Buyer', text: 'Fast delivery, gorgeous packaging, and the loyalty points are a lovely bonus. My go-to beauty store.', rating: 5 },
]

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()])

  return (
    <div className="min-h-screen flex flex-col luxury-gradient overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        {/* ───────── Hero ───────── */}
        <section className="relative min-h-screen flex items-center pt-20 mesh-hero">
          {/* floating decorative blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-24 w-[520px] h-[520px] bg-primary/15 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute top-1/2 -left-28 w-[420px] h-[420px] bg-secondary/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* copy */}
              <div className="text-center lg:text-left animate-fade-up">
                <Badge className="inline-flex items-center gap-1.5 mb-6 glass-pink border-0 text-primary px-4 py-1.5 text-sm font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> New Collection · 2025
                </Badge>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-foreground mb-6 text-shadow-soft">
                  Reveal Your
                  <span className="block rose-gold-text italic">Natural Glow</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
                  Discover luxurious cosmetics crafted with the finest ingredients. Elevate your beauty ritual with our curated pink collection.
                </p>
                <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="rose-gold-gradient border-0 text-white hover:opacity-95 pink-glow px-8 cursor-pointer" asChild>
                    <Link href="/shop">Shop Now <ArrowRight className="ml-2 w-5 h-5" /></Link>
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 cursor-pointer border-primary/30 text-primary hover:bg-primary/5" asChild>
                    <Link href="/shop?featured=true">View Collection</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
                  {[
                    { value: '50K+', label: 'Happy Customers' },
                    { value: '200+', label: 'Products' },
                    { value: '4.9', label: 'Avg Rating', star: true },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <p className="font-display font-bold text-3xl rose-gold-text flex items-center justify-center gap-1">
                        {stat.value}{stat.star && <Star className="w-5 h-5 fill-primary text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 tracking-wide">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* hero image collage */}
              <div className="hidden lg:grid grid-cols-2 gap-4 h-[600px]">
                <div className="flex flex-col gap-4">
                  <div className="relative flex-1 rounded-[2rem] overflow-hidden pink-glow animate-float">
                    <Image src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600" alt="Luxury cosmetics" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                  </div>
                  <div className="relative h-52 rounded-[2rem] overflow-hidden animate-float" style={{ animationDelay: '1s' }}>
                    <Image src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600" alt="Serum" fill className="object-cover" />
                  </div>
                </div>
                <div className="flex flex-col gap-4 mt-14">
                  <div className="relative h-52 rounded-[2rem] overflow-hidden animate-float-slow">
                    <Image src="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600" alt="Lipstick" fill className="object-cover" />
                  </div>
                  <div className="relative flex-1 rounded-[2rem] overflow-hidden pink-glow animate-float-slow" style={{ animationDelay: '1.5s' }}>
                    <Image src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600" alt="Fragrance" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* marquee strip */}
          <div className="absolute bottom-0 left-0 right-0 rose-gold-gradient py-2.5 overflow-hidden">
            <div className="flex items-center justify-center gap-8 text-white text-sm font-medium tracking-wide">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Free shipping over Rs. 1,000</span>
              <span className="hidden sm:flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Cruelty-free & vegan</span>
              <span className="hidden md:flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Earn rewards on every order</span>
            </div>
          </div>
        </section>

        {/* ───────── Categories ───────── */}
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-semibold tracking-[0.2em] uppercase mb-3">Explore</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-3">Shop by Category</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Curated beauty collections for every part of your ritual</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-3xl aspect-[3/4] bg-muted cursor-pointer hover:-translate-y-2 transition-all duration-300 pink-glow-sm animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {categoryImages[cat.slug] && (
                  <Image src={categoryImages[cat.slug]} alt={cat.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#831843]/85 via-[#831843]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-display font-semibold text-white text-base">{cat.name}</p>
                  <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Shop now <ChevronRight className="w-3.5 h-3.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ───────── Featured Products ───────── */}
        {products.length > 0 && (
          <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-sm text-primary font-semibold tracking-[0.2em] uppercase mb-3">✦ Curated For You</p>
                <h2 className="font-display text-4xl sm:text-5xl font-bold">Bestsellers</h2>
              </div>
              <Link href="/shop?featured=true" className="hidden sm:flex items-center gap-1 text-sm text-primary font-semibold hover:gap-2 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="sm:hidden mt-8 text-center">
              <Button variant="outline" className="cursor-pointer border-primary/30 text-primary" asChild>
                <Link href="/shop">View All Products <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          </section>
        )}

        {/* ───────── Editorial Banner ───────── */}
        <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] min-h-[360px] flex items-center">
            <Image
              src="https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=1200"
              alt="Beauty editorial"
              fill className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#831843]/80 via-[#BE185D]/50 to-transparent" />
            <div className="relative px-8 md:px-16 max-w-lg text-white">
              <Badge className="glass border-0 text-white mb-4 px-4 py-1.5">Limited Edition</Badge>
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">The Rose Collection</h2>
              <p className="text-white/85 mb-6 leading-relaxed">
                Indulge in our signature rose-infused line — petal-soft formulas that nourish, brighten, and leave you glowing.
              </p>
              <Button className="bg-white text-primary hover:bg-white/90 cursor-pointer font-semibold" asChild>
                <Link href="/shop?category=skincare">Discover Now <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ───────── Loyalty Banner ───────── */}
        <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] rose-gold-gradient p-8 md:p-14 text-white text-center pink-glow">
            <div className="absolute inset-0 opacity-20 mesh-hero" />
            <div className="relative">
              <Badge className="bg-white/20 text-white border-white/30 mb-4 px-4 py-1.5 backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5 mr-1.5" /> <BrandName /> Rewards
              </Badge>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-3">Join the Glow Club</h2>
              <p className="text-white/85 max-w-xl mx-auto mb-8 leading-relaxed">
                Earn points on every purchase and unlock exclusive tiers — Bronze, Silver, Gold, and Platinum — for bigger rewards, free shipping, and VIP perks.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                {['🥉 Bronze', '🥈 Silver', '🥇 Gold', '💎 Platinum'].map(tier => (
                  <div key={tier} className="px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-sm font-medium">{tier}</div>
                ))}
              </div>
              <Button className="bg-white text-primary hover:bg-white/90 cursor-pointer font-semibold px-8" asChild>
                <Link href="/auth">Join Free & Start Earning <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ───────── Testimonials ───────── */}
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-semibold tracking-[0.2em] uppercase mb-3">Loved By Thousands</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold">What Our Glow Squad Says</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className="glass-pink rounded-3xl p-7 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rose-gold-gradient rounded-full flex items-center justify-center text-white font-semibold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Values ───────── */}
        <section className="pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-7 rounded-3xl glass-pink hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 rose-gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 pink-glow-sm">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export const dynamic = 'force-dynamic'
