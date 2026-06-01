// PM2 process config for the Empress Dreams Cosmetics Next.js app.
// Usage on the VPS:  pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'empress-dreams',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3100',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
      },
    },
  ],
}
