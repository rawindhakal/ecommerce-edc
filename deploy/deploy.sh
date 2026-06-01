#!/usr/bin/env bash
# Run ON THE VPS, inside the project directory, to (re)deploy.
# First time: make sure .env.local exists with your Supabase keys.
set -e

echo "→ Installing dependencies…"
npm ci || npm install

echo "→ Building production bundle…"
npm run build

echo "→ Restarting app with PM2…"
if pm2 describe empress-dreams > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo "✓ Deployed. App running on port 3000."
pm2 status
