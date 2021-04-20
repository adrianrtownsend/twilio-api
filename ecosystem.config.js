module.exports = {
  apps : [{
    name: "server",
    script: "./server.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
      error_file: 'error.log',
      out_file: 'out.log',
      log_file: 'log.log',
      time: true
    }
  }]
}