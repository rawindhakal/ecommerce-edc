'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const sortOptions = [
  { value: '', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function SortSelect({ current }: { current?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) params.set('sort', e.target.value)
    else params.delete('sort')
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <select
      defaultValue={current || ''}
      onChange={handleChange}
      className="text-sm border border-border rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
    >
      {sortOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
