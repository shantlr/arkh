import { ServiceSpec } from '@shantr/metro-common-types';
import { createLogger, Logger } from '@shantr/metro-logger';
import {
  spawn,
  SpawnOptionsWithoutStdio,
  ChildProcessWithoutNullStreams,
} from 'child_process';
import { SideEffects } from 'src/events/sideEffects';

export type TaskState =
  | 'noop'
  | 'creating'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'exited';

const logger = createLogger(`task`);

export class Task {
  serviceName: string;
  state: TaskState = 'noop';

  spec: ServiceSpec;

  process: ChildProcessWithoutNullStreams = null;

  constructor({
    serviceName,
    spec,
  }: {
    serviceName: string;
    spec: ServiceSpec;
  }) {
    this.serviceName = serviceName;
    this.spec = spec;
  }

  isRunning() {
    return this.state === 'running';
  }

  async exec() {
    if (!['noop', 'stopped', 'exited'].includes(this.state)) {
      throw new Error(`cannot exec in current state: ${this.state}`);
    }
    try {
      this.state = 'creating';
      logger.info(`creating '${this.serviceName}'`);
      void SideEffects.emit('taskStateUpdate', {
        serviceName: this.serviceName,
        state: this.state,
      });
      const cmd = this.spec.cmd[0];
      const args = this.spec.cmd.slice(1);
      const options: SpawnOptionsWithoutStdio = {};
      if (this.spec.path) {
        options.cwd = this.spec.path;
      }
      if (this.spec.env) {
        options.env = this.spec.env;
      }
      this.process = spawn(cmd, args, options);
      logger.info(`running '${this.serviceName}'`);

      this.state = 'running';
      void SideEffects.emit('taskStateUpdate', {
        serviceName: this.serviceName,
        state: this.state,
      });

      this.process.stdout.on('data', (chunk) => {
        void SideEffects.emit('taskStdout', {
          serviceName: this.serviceName,
          log: chunk,
        });
      });
      this.process.stderr.on('data', (chunk) => {
        void SideEffects.emit('taskStderr', {
          serviceName: this.serviceName,
          log: chunk,
        });
      });
      this.process.on('close', (code) => {
        logger.info(`'${this.serviceName}' exited`);
        this.state = 'exited';
        void SideEffects.emit('taskStateUpdate', {
          serviceName: this.serviceName,
          state: this.state,
        });
        if (code !== 0) {
          //
        } else {
          //
        }
      });
    } catch (err) {
      this.process = null;
      this.state = 'noop';
      throw err;
    }
  }
  async stop() {
    if (!['running'].includes(this.state)) {
      throw new Error(`cannot stop in current state: ${this.state}`);
    }
    try {
      this.state = 'stopping';
    } catch (err) {
      this.state = 'noop';
      throw err;
    }
  }

  async restart() {
    if (this.state === 'running') {
      await this.stop();
    }
    await this.exec();
  }

  updateSpec(spec: ServiceSpec) {
    this.spec = spec;
  }
}
