import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return 'Rs. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

export function formatPriceCompact(amount: number): string {
  return 'Rs. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export function getLoyaltyTierColor(tier: string) {
  const colors: Record<string, string> = {
    bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2'
  }
  return colors[tier] ?? '#CD7F32'
}

export function getLoyaltyTierBg(tier: string) {
  const bgs: Record<string, string> = {
    bronze: 'from-amber-700 to-amber-500',
    silver: 'from-slate-500 to-slate-300',
    gold: 'from-yellow-600 to-yellow-400',
    platinum: 'from-slate-400 to-slate-200'
  }
  return bgs[tier] ?? 'from-amber-700 to-amber-500'
}

export function getNextTierPoints(tier: string) {
  const thresholds: Record<string, number | null> = {
    bronze: 500, silver: 2000, gold: 5000, platinum: null
  }
  return thresholds[tier]
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}
