module.exports = {
    apps : [{
        name: 'top_view',
        script: './server.js',
        cwd: './',
        // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
        instances: 3,
        autorestart: true,
        watch: false,
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }]
};
