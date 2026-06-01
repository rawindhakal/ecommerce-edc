-- patch-003-payment-methods.sql
-- Adds Nepal payment methods to the payment_method enum
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'esewa';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'fonepay';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';
