import { ServiceSpec } from '@shantlr/shipyard-common-types';
import {
  spawn,
  SpawnOptionsWithoutStdio,
  ChildProcessWithoutNullStreams,
} from 'child_process';
import { nanoid } from 'nanoid';
import { baseLogger } from '../../config';
import { SideEffects } from '../../workflow/sideEffects';

export type TaskState =
  | 'noop'
  | 'creating'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'exited';

const logger = baseLogger.extend(`task`);

export class Task {
  id: string;
  serviceName: string;
  state: TaskState = 'noop';

  spec: ServiceSpec;

  process: ChildProcessWithoutNullStreams = null;

  endDetail: {
    code: number;
    at: Date;
  } = null;

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
      this.id = nanoid();
      this.state = 'creating';
      this.endDetail = null;
      logger.info(`creating '${this.serviceName}'`);
      this.sendState();

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
        id: this.id,
        serviceName: this.serviceName,
        state: this.state,
      });

      this.process.stdout.on('data', (chunk) => {
        void SideEffects.emit('taskStdout', {
          id: this.id,
          serviceName: this.serviceName,
          log: chunk,
        });
      });
      this.process.stderr.on('data', (chunk) => {
        void SideEffects.emit('taskStderr', {
          id: this.id,
          serviceName: this.serviceName,
          log: chunk,
        });
      });
      this.process.on('close', (code) => {
        logger.info(`'${this.serviceName}' exited (${code})`);
        this.process = null;
        this.state = 'exited';
        this.endDetail = {
          at: new Date(),
          code,
        };
        void SideEffects.emit('taskStateUpdate', {
          id: this.id,
          serviceName: this.serviceName,
          state: this.state,
          exitCode: code,
        });
      });
    } catch (err) {
      this.process = null;
      this.state = 'noop';
      throw err;
    }
  }
  async stop(reason = 'reason-not-provided') {
    if (!['running'].includes(this.state)) {
      throw new Error(`cannot stop in current state: ${this.state}`);
    }
    if (!this.process) {
      logger.warn(
        `task '${this.serviceName}' could not stop: no process. (did process exit inbeetween ?)`
      );
      return;
    }
    try {
      // kill process with timeout
      this.state = 'stopping';
      let timeout = null;
      await Promise.race([
        new Promise<void>((resolve) => {
          this.process.once('close', () => {
            resolve();
          });
          this.process.kill();
        }),
        new Promise<void>((resolve) => {
          timeout = setTimeout(() => {
            logger.warn(
              `kill '${this.serviceName}' timeout, fallback to sending SIGKILL`
            );
            // force kill after timeout
            if (this.process) {
              this.process.kill('SIGKILL');
            }
            resolve();
          }, 5 * 1000);
        }),
      ]);
      clearTimeout(timeout);
      this.process = null;
      logger.info(`'${this.serviceName}' stopped: ${reason}`);
    } catch (err) {
      this.state = 'noop';
      this.process = null;
      throw err;
    }
  }

  sendState() {
    void SideEffects.emit('taskStateUpdate', {
      id: this.id,
      serviceName: this.serviceName,
      state: this.state,
      spec: this.spec,
    });
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
