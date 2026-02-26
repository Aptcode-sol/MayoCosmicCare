module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
