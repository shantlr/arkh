import { ServiceInfo } from '@shantr/metro-common-types';
import ky from 'ky';
import { QueryClient } from 'react-query';
import io from 'socket.io-client';
import { ServiceTask, ServiceTaskLog, Stack } from './types';

export const API_URL = process.env.REACT_APP_API_URL;

export const queryClient = new QueryClient();

const base = ky.extend({
  prefixUrl: API_URL,
});
export const API = {
  stack: {
    async list(): Promise<Stack[]> {
      const res = await base.get('stack/list');
      return res.json();
    },
    async get(name: string) {
      const res = await base.get(`stack/${name}`);
      return res.json();
    },
    async run({ name }: { name: string }) {
      const res = await base.post(`stack/${name}/run`);
      return res.json();
    },

    async serviceStates({ name }: { name: string }) {
      const res = await base.get(`stack/${name}/services/state`);
      return res.json();
    },
  },
  service: {
    async list() {
      const res = await base.get('service/list');
      return res.json();
    },
    async get(name: string): Promise<ServiceInfo> {
      const res = await base.get(`service/${name}`);

      return res.json();
    },
    async run({ name }: { name: string }) {
      const res = await base.post(`service/${name}/run`);
      return res.json();
    },

    task: {
      async list(serviceName: string): Promise<ServiceTask[]> {
        const res = await base.get(`service/${serviceName}/tasks`);
        return res.json();
      },
      async logs(taskId: string): Promise<ServiceTaskLog[]> {
        const res = await base.get(`service-task/${taskId}/logs`);
        return res.json();
      },
    },
  },
};

const WS_URL = process.env.REACT_APP_API_WS as string;
export const createSocket = () => {
  return io(WS_URL, {
    transports: ['websocket'],
  });
};
