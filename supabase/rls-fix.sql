-- ============================================================
-- GlowLux RLS Fix
-- Run this in Supabase SQL Editor
-- ============================================================

-- ===================== ORDERS =====================
-- Drop the broken INSERT policy (NULL = NULL is NULL, not TRUE)
DROP POLICY IF EXISTS "Customers can create orders" ON orders;

-- Replacement: allows authenticated users placing their own order,
-- guest checkout (NULL customer_id), and staff/admin POS inserts
CREATE POLICY "Orders can be inserted" ON orders
  FOR INSERT WITH CHECK (
    -- Logged-in customer creating their own order
    (auth.uid() IS NOT NULL AND customer_id = auth.uid())
    -- Guest checkout (no account)
    OR (customer_id IS NULL)
    -- Staff or admin (POS orders, manual orders)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Also fix the SELECT policy to include NULL customer_id rows for guests
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Orders are viewable by owner or staff" ON orders
  FOR SELECT USING (
    customer_id = auth.uid()
    OR customer_id IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ===================== ORDER ITEMS =====================
-- Allow staff/admin to insert order items (POS)
DROP POLICY IF EXISTS "Order items insertable" ON order_items;
CREATE POLICY "Order items insertable" ON order_items
  FOR INSERT WITH CHECK (
    TRUE  -- Order items are always inserted alongside a valid order
  );

-- ===================== INVENTORY TRANSACTIONS =====================
-- Enable RLS and add policies (was missing)
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can insert inventory transactions" ON inventory_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can view inventory transactions" ON inventory_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ===================== LOYALTY TRANSACTIONS =====================
-- Add INSERT policy (was completely missing — blocked all inserts)
CREATE POLICY "Loyalty transactions can be inserted" ON loyalty_transactions
  FOR INSERT WITH CHECK (
    -- User inserting their own points (e.g. online checkout)
    customer_id = auth.uid()
    -- Staff/admin inserting on behalf of customer (POS, adjustments)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ===================== PROFILES UPDATE =====================
-- Allow staff to update customer profiles (needed for POS loyalty point sync)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
    )
  );

-- ===================== INVENTORY UPDATE =====================
-- The existing "Admins can manage inventory" covers UPDATE via FOR ALL,
-- but FOR ALL uses USING (not WITH CHECK) — ensure it covers UPDATE correctly
DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory;
CREATE POLICY "Staff can manage inventory" ON inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );
