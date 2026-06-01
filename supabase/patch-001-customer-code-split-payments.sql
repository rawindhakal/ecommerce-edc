-- patch-001-customer-code-split-payments.sql
-- Safe to run multiple times (idempotent)

-- ============================================================
-- 1. Add customer_code column to profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'customer_code'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN customer_code TEXT UNIQUE;
  END IF;
END $$;

-- ============================================================
-- 2. Add split_payments column to orders
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'orders'
      AND column_name  = 'split_payments'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN split_payments JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- 3. Trigger function: generate_customer_code()
--    Generates a unique random 4-digit string (1000-9999)
--    and retries until it does not collide with existing codes.
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_customer_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Only generate if not already provided
  IF NEW.customer_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    -- Random integer in [1000, 9999] converted to 4-char string
    v_code := LPAD((FLOOR(RANDOM() * 9000)::INT + 1000)::TEXT, 4, '0');

    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE customer_code = v_code
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  NEW.customer_code := v_code;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles (drop first so re-running is safe)
DROP TRIGGER IF EXISTS trg_generate_customer_code ON public.profiles;

CREATE TRIGGER trg_generate_customer_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_customer_code();

-- ============================================================
-- 4. RLS INSERT policy: staff/admin can insert new profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Staff can insert profiles'
  ) THEN
    CREATE POLICY "Staff can insert profiles"
      ON public.profiles
      FOR INSERT
      WITH CHECK (
        auth.uid() = id
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'staff')
        )
      );
  END IF;
END $$;

-- ============================================================
-- 5. Function: set_user_admin(user_email TEXT)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_user_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = user_email;
END;
$$;

-- ============================================================
-- 6. Promote initial admin
-- ============================================================
SELECT public.set_user_admin('rawindhakal@gmail.com');
