// Run from the project root with: pm2 start pm2.config.js
// The built backend and production environment variables are prerequisites.
const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'school-erp-api',
      cwd: path.resolve(__dirname, 'backend'),
      script: 'dist/main.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      time: true,
      env: {
        NODE_ENV: 'production',
        // DATABASE_URL, REDIS_URL, SESSION_SECRET and FRONTEND_ORIGIN
        // must come from backend/.env or the process environment.
      },
    },
  ],
};
