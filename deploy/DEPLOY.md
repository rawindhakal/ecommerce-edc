# Deploying Empress Dreams Cosmetics to a VPS (edc.cakezake.com)

This app is a Next.js 16 server app (SSR + middleware + API routes). It needs Node.js 20+ running behind Nginx. The database is already on Supabase cloud, so only the app is hosted here.

## 0. Prerequisites on the VPS
- Ubuntu 22.04/24.04 (or similar)
- Root or sudo SSH access
- DNS: an **A record** `edc` under `cakezake.com` pointing to the VPS public IP

## 1. Point the subdomain
In your DNS provider for `cakezake.com`, add:
```
Type: A    Name: edc    Value: <VPS_PUBLIC_IP>    TTL: auto
```
Verify (wait a few minutes): `dig +short edc.cakezake.com` → returns the IP.

## 2. Install Node, Nginx, PM2 (once)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2
node -v   # should be v20.x
```

## 3. Get the code onto the VPS
Option A — via Git (recommended):
```bash
cd /var/www
sudo git clone <YOUR_REPO_URL> empress-dreams
sudo chown -R $USER:$USER empress-dreams
cd empress-dreams
```
Option B — upload from your Mac (no repo):
```bash
# from your Mac, in the project folder:
rsync -avz --exclude node_modules --exclude .next ./ user@<VPS_IP>:/var/www/empress-dreams/
```

## 4. Add environment variables
```bash
cd /var/www/empress-dreams
cp .env.production.example .env.local
nano .env.local   # paste your real Supabase URL + anon + service-role keys
```

## 5. Build & start
```bash
bash deploy/deploy.sh
pm2 startup    # run the command it prints, so the app auto-starts on reboot
```
App now runs on `127.0.0.1:3000`.

## 6. Nginx reverse proxy
```bash
sudo cp deploy/nginx-edc.cakezake.com.conf /etc/nginx/sites-available/edc.cakezake.com
sudo ln -s /etc/nginx/sites-available/edc.cakezake.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
Visit `http://edc.cakezake.com` — it should load.

## 7. Free HTTPS (Let's Encrypt)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d edc.cakezake.com
```
Now `https://edc.cakezake.com` works with auto-renewing SSL.

## 8. Prepare the database (once)
In Supabase → SQL Editor, run in order:
`schema.sql` → `rls-fix.sql` → `patch-001` → `patch-002` → `patch-003` → `patch-004` → `patch-005`.
Then create your admin user (Auth → Add User) and confirm `patch-001` promoted `rawindhakal@gmail.com` to admin.

## Redeploying later (after code changes)
```bash
cd /var/www/empress-dreams
git pull           # or rsync again
bash deploy/deploy.sh
```

## Handy commands
```bash
pm2 status              # app health
pm2 logs empress-dreams # live logs
pm2 reload empress-dreams
sudo systemctl reload nginx
```
