import { Socket } from 'socket.io';
import { ServiceConfig } from 'src/events/types';

export type RunnerType = 'run-process';
export type RunnerState = 'ready' | 'disconnected';
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

  async assignService({ name, spec }: { name: string; spec: ServiceConfig }) {
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
}
