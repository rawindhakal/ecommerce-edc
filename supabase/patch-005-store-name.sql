-- patch-005-store-name.sql
-- Set the business name to "Empress Dreams Cosmetics".
-- Run in Supabase SQL Editor. Safe to run multiple times.

INSERT INTO public.store_settings (key, value)
VALUES ('store_name', 'Empress Dreams Cosmetics')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.store_settings (key, value)
VALUES ('receipt_footer', 'Thank you for shopping at Empress Dreams Cosmetics!')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
