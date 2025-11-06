
## 🚀 **ecosystem.config.js**

```javascript
module.exports = {
  apps: [
    // Application Backend
    {
      name: 'buy-sell-backend',
      script: './backend/src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        INSTANCE_ID: 0
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        INSTANCE_ID: 0
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        INSTANCE_ID: 0
      },
      // Logging configuration
      log_file: './logs/backend-combined.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      // Performance tuning
      node_args: [
        '--max-old-space-size=1024',
        '--max-http-header-size=16384',
        '--v8-pool-size=1'
      ],
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Auto-restart configuration
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Health check
      health_check_interval: 30000,
      // Ignore watch patterns
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git',
        'coverage',
        'test'
      ]
    },

    // Application Frontend (Next.js)
    {
      name: 'buy-sell-frontend',
      script: './frontend/node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: './frontend',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        INSTANCE_ID: 0
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        INSTANCE_ID: 0
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        INSTANCE_ID: 0
      },
      // Logging configuration
      log_file: './logs/frontend-combined.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      // Performance tuning
      node_args: [
        '--max-old-space-size=512',
        '--max-http-header-size=16384'
      ],
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Auto-restart configuration
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Ignore watch patterns
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '.git',
        'coverage',
        'test'
      ]
    },

    // Worker pour les tâches en arrière-plan
    {
      name: 'buy-sell-worker',
      script: './backend/src/workers/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'main'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'main'
      },
      // Logging configuration
      log_file: './logs/worker-combined.log',
      out_file: './logs/worker-out.log',
      error_file: './logs/worker-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      // Auto-restart configuration
      min_uptime: '30s',
      max_restarts: 5,
      restart_delay: 10000,
      // Cron-like restart for memory cleanup
      cron_restart: '0 3 * * *'
    },

    // Worker pour les emails
    {
      name: 'buy-sell-email-worker',
      script: './backend/src/workers/email.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'email'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'email'
      },
      log_file: './logs/email-worker-combined.log',
      out_file: './logs/email-worker-out.log',
      error_file: './logs/email-worker-err.log'
    },

    // Worker pour les paiements
    {
      name: 'buy-sell-payment-worker',
      script: './backend/src/workers/payment.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'payment'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'payment'
      },
      log_file: './logs/payment-worker-combined.log',
      out_file: './logs/payment-worker-out.log',
      error_file: './logs/payment-worker-err.log'
    }
  ],

  // Configuration de déploiement
  deploy: {
    production: {
      user: 'deploy',
      host: [
        {
          host: 'your-production-server.com',
          port: '22'
        }
      ],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/buy-sell-platform.git',
      path: '/var/www/buy-sell-platform/production',
      'pre-setup': 'mkdir -p /var/www /var/logs /var/www/buy-sell-platform',
      'post-deploy': `
        npm install --production &&
        npm run build:all &&
        pm2 reload ecosystem.config.js --env production &&
        pm2 save
      `,
      'pre-deploy-local': `
        echo 'Deploying to production...' &&
        git status
      `,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    staging: {
      user: 'deploy',
      host: [
        {
          host: 'your-staging-server.com',
          port: '22'
        }
      ],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/buy-sell-platform.git',
      path: '/var/www/buy-sell-platform/staging',
      'post-deploy': `
        npm install &&
        npm run build:all &&
        pm2 reload ecosystem.config.js --env staging &&
        pm2 save
      `,
      env: {
        NODE_ENV: 'staging',
        PORT: 3001
      }
    },
    development: {
      user: 'deploy',
      host: [
        {
          host: 'your-dev-server.com',
          port: '22'
        }
      ],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/buy-sell-platform.git',
      path: '/var/www/buy-sell-platform/development',
      'post-deploy': `
        npm install &&
        pm2 reload ecosystem.config.js --env development &&
        pm2 save
      `,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    }
  }
};
