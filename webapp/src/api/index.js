const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3005/api';

const SOCKET_URL =
  process.env.REACT_APP_API_SOCKET_BASE_URL || 'http://localhost:3005';

export const API = {
  socketUrl: SOCKET_URL,
  command: {
    exec: (name) =>
      fetch(`${BASE_URL}/commands/${name}/exec`, {
        method: 'POST',
      }),
    stop: (name) =>
      fetch(`${BASE_URL}/commands/${name}/stop`, {
        method: 'POST',
      }),
    list: () => fetch(`${BASE_URL}/commands`).then((r) => r.json()),
    create: (command) => {
      return fetch(`${BASE_URL}/commands/create`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(command),
      }).then(async (r) => {
        if (r.status === 200) {
          return true;
        }
        throw new Error(`${r.status}: ${await r.text()}`);
      });
    },
    update: (name, command) => {
      return fetch(`${BASE_URL}/commands/${name}/update`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(command),
      }).then(async (r) => {
        if (r.status === 200) {
          return true;
        }
        throw new Error(`${r.status}: ${await r.text()}`);
      });
    },
  },
  template: {
    list: () => fetch(`${BASE_URL}/templates`).then((r) => r.json()),
    create: (template) => {
      return fetch(`${BASE_URL}/templates/create`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(template),
      }).then(async (r) => {
        if (r.status === 200) {
          return true;
        }
        throw new Error(`${r.status}: ${await r.text()}`);
      });
    },
    update: (name, template) => {
      return fetch(`${BASE_URL}/templates/${name}/update`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(template),
      }).then(async (r) => {
        if (r.status === 200) {
          return true;
        }
        throw new Error(`${r.status}: ${await r.text()}`);
      });
    },
  },
};
