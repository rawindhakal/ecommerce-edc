-- patch-004-fix-product-images.sql
-- Replaces dead Unsplash image URLs in already-seeded products.
-- Safe to run multiple times.

UPDATE products
SET images = REPLACE(images::text, 'photo-1541643600914-78b084683702', 'photo-1592945403244-b3fbafd7f539')::jsonb
WHERE images::text LIKE '%1541643600914%';

UPDATE products
SET images = REPLACE(images::text, 'photo-1586495777744-4e6232bf2c7f', 'photo-1571781926291-c477ebfd024b')::jsonb
WHERE images::text LIKE '%1586495777744%';
