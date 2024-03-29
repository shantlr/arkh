import { Socket } from 'socket.io';
import { ServiceSpec } from '@arkh/types';

export type RunnerType = 'run-process';
export type RunnerState =
  | 'not-inited'
  | 'ready'
  | 'leaving'
  | 'gracefully-disconnected'
  | 'ungracefully-disconnected';
export class Runner {
  id: string;
  socket: Socket;
  type: RunnerType;
  state: RunnerState;

  constructor({
    id,
    type,
    socket,
    state,
  }: {
    id: string;
    type: RunnerType;
    socket: Socket;
    state: RunnerState;
  }) {
    this.id = id;
    this.socket = socket;
    this.type = type;
    this.state = state;
  }

  async assignService({ name, spec }: { name: string; spec: ServiceSpec }) {
    await new Promise<void>((resolve) => {
      this.socket.emit(
        'run-service',
        {
          name,
          spec,
        },
        () => {
          resolve();
        }
      );
    });
  }
  async stopService({ name, reason }: { name: string; reason?: string }) {
    return new Promise<void>((resolve) => {
      this.socket.emit(
        'stop-service',
        {
          name,
          reason,
        },
        () => {
          resolve();
        }
      );
    });
  }
}
