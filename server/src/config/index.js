require('./env');
const convict = require('convict');

module.exports.config = convict({
  service: {
    port: {
      env: 'SERVICE_PORT',
      default: 3005,
    },
    name: {
      env: 'SERVICE_NAME',
      default: 'metro-server',
    },
  },
  directory: {
    env: 'HOME',
    default: '',
  },
  sqlite: {
    file: {
      default: './data/db.sqlite',
    },
  },
});
module.exports.debug = require('debug')(
  module.exports.config.get('service.name')
);
