module.exports = {
    apps : [
        {
            name: "top_view",
            script: "./server.js",
            watch: true,
            env: {
                "NODE_ENV": "development"
            },
            env_production: {
                "NODE_ENV": "production"
            }
        }
    ]
}