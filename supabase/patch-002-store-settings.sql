-- patch-002-store-settings.sql  (idempotent)

-- ===================== STORE SETTINGS =====================
CREATE TABLE IF NOT EXISTS public.store_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_settings' AND policyname='Staff can read settings') THEN
    CREATE POLICY "Staff can read settings" ON public.store_settings FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_settings' AND policyname='Admin can manage settings') THEN
    CREATE POLICY "Admin can manage settings" ON public.store_settings FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- Seed defaults (won't overwrite existing)
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name',            'Empress Dreams Cosmetics'),
  ('store_address',         'Kathmandu, Nepal'),
  ('store_phone',           '+977-XXXXXXXXXX'),
  ('store_email',           'hello@glowlux.com'),
  ('store_website',         'https://glowlux.com'),
  ('receipt_footer',        'Thank you for shopping at Empress Dreams Cosmetics!'),
  ('vat_rate',              '13'),
  ('vat_enabled',           'true'),
  ('currency',              'NPR'),
  ('loyalty_enabled',       'true'),
  ('loyalty_points_per_100','1'),
  ('loyalty_redeem_rate',   '1'),
  ('tier_silver',           '500'),
  ('tier_gold',             '2000'),
  ('tier_platinum',         '5000'),
  ('shipping_free_threshold','1000'),
  ('shipping_flat_rate',    '150'),
  ('cod_enabled',           'true'),
  ('notify_new_order',      'true'),
  ('notify_low_stock',      'true'),
  ('low_stock_threshold',   '10'),
  ('notify_daily_report',   'false'),
  ('notify_tier_upgrade',   'true')
ON CONFLICT (key) DO NOTHING;

-- ===================== STAFF TABLE updates =====================
-- Ensure phone column exists on profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;
