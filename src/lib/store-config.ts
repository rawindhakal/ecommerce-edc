/**
 * Single source of truth for the business / brand name.
 * Editable from Admin → Settings (store_settings.store_name).
 */
export const DEFAULT_STORE_NAME = 'Empress Dreams Cosmetics'
export const DEFAULT_STORE_TAGLINE = 'Luxury Cosmetics'

// Module-level holder so non-React code (e.g. print HTML builders) can read the
// latest resolved brand name without prop drilling. Updated by StoreConfigProvider.
let _brandName = DEFAULT_STORE_NAME
export function setBrandName(name: string) { if (name) _brandName = name }
export function getBrandName(): string { return _brandName }

/** Manager PIN required to delete orders. */
export const ORDER_DELETE_PIN = '340234'
