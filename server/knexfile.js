// Update with your config settings.

const { config } = require('./src/config');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: config.get('sqlite.file'),
    },
  },
};
