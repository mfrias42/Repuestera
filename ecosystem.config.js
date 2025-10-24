module.exports = {
  apps: [{
    name: 'repuestera-backend',
    script: 'server.js',
    instances: 'max', // Usar todos los cores disponibles
    exec_mode: 'cluster',
    watch: false, // Deshabilitado en producción
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001
    },
    // Configuración de logs
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configuración de reinicio automático
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configuración de cluster
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Variables de entorno específicas
    env_vars: {
      'COMMON_VARIABLE': 'true'
    },
    
    // Configuración de monitoreo
    pmx: true,
    
    // Configuración de merge logs
    merge_logs: true,
    
    // Configuración de source map
    source_map_support: true,
    
    // Configuración de ignore watch
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads',
      '.git'
    ]
  }],

  // Configuración de despliegue
  deploy: {
    production: {
      user: 'deploy',
      host: ['tu-servidor.com'],
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/repuestera-backend.git',
      path: '/var/www/repuestera-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    staging: {
      user: 'deploy',
      host: ['staging-servidor.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:tu-usuario/repuestera-backend.git',
      path: '/var/www/repuestera-backend-staging',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env staging'
    }
  }
};