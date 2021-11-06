require('./env');
const convict = require('convict');

module.exports.config = convict({
  service: {
    name: {
      env: 'SERVICE_NAME',
      default: 'metro-runner',
    },
  },
  server: {
    url: {
      env: 'SERVER_URL',
      default: 'ws://localhost:3005'
    }
  },
});
