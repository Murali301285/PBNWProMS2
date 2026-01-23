module.exports = {
    apps: [{
        name: "ProMS",
        script: "server.js",
        env: {
            PORT: 3005,
            NODE_ENV: "production"
        }
    }]
}
