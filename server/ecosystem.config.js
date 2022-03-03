module.exports = {
  apps : [{
    name: 'topmsv',
    script: './server.js',
    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    instances: 1,
    autorestart: true,
    watch: false,
    log_file: './logs/combined.log',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
