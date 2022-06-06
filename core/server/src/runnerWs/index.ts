import { Server } from 'socket.io';
import { ServiceSpec } from '@shantlr/shipyard-common-types';

import { baseLogger, config } from '../config';
import { Task, TaskLog } from '../data';
import { runnersWorkflow, servicesWorkflow } from '../workflow';

import { RunnerType } from './class';

export const startRunnerWs = async ({
  logger = baseLogger.extend('ws:runner'),
} = {}) => {
  const io = new Server({});

  io.on('connection', (socket) => {
    let runnerId = null;
    socket.on(
      'runner-ready',
      (event: {
        id: string;
        type: RunnerType;
        tasks: {
          id: string;
          serviceName: string;
          state: string;
          exited_at?: Date;
          exit_code?: number;
        }[];
      }) => {
        runnerId = event.id;

        console.log('tasks', event.tasks);

        runnersWorkflow.get(runnerId).actions.ready({
          type: event.type,
          socket,
        });
      }
    );

    socket.on('disconnect', () => {
      logger.info(`'${runnerId}' disconnected`);
      if (runnerId && runnersWorkflow.has(runnerId)) {
        void runnersWorkflow.leave(runnerId).catch((err) => {
          logger.warn(`failed to leave runner: %o`, err);
        });
      }
    });
    socket.on('runner-leave', ({ reason }: { reason: string }, ack) => {
      logger.info(`runner '${runnerId}' is leaving: ${reason}`);
      if (runnerId && runnersWorkflow.has(runnerId)) {
        void runnersWorkflow.leave(runnerId).catch((err) => {
          logger.warn(`failed to leave runner: %o`, err);
        });
      }
      ack(true);
    });

    socket.on(
      'task-state',
      async ({
        id: taskId,
        serviceName,
        state,
        spec,

        exitCode,
      }: {
        id: string;
        serviceName: string;
        state: string;
        spec?: ServiceSpec;
        exitCode?: number;
      }) => {
        const service = servicesWorkflow.get(serviceName);
        if (!service) {
          logger.info(
            `task-state not updated: service '${serviceName}' not found`
          );
          return;
        }

        if (service.state.assigned_runner_id !== runnerId) {
          logger.error(
            `WARNING: task started by runner '${runnerId}' but is assigned to '${service.state.assigned_runner_id}'`
          );
        }

        switch (state) {
          case 'creating': {
            servicesWorkflow.get(serviceName).actions.taskCreating({ taskId });
            await Task.create({
              id: taskId,
              serviceName,
              serviceSpec: spec,
              runnerId,
            });
            break;
          }
          case 'running': {
            servicesWorkflow.get(serviceName).actions.taskRunning({ taskId });
            await Task.update.runningAt(taskId);
            break;
          }
          case 'stopping': {
            servicesWorkflow.get(serviceName).actions.taskStopping({ taskId });
            await Task.update.stoppingAt(taskId);
            break;
          }
          case 'stopped': {
            servicesWorkflow.get(serviceName).actions.taskStopped({ taskId });
            await Task.update.stoppedAt(taskId);
            break;
          }
          case 'exited': {
            servicesWorkflow.get(serviceName).actions.taskExited({ taskId });
            await Task.update.exited(taskId, exitCode);
            break;
          }
          default:
        }
      }
    );
    socket.on(
      'task-stdout',
      async ({
        id: taskId,
        log,
      }: {
        id: string;
        serviceName: string;
        log: Buffer;
      }) => {
        await TaskLog.add({
          id: taskId,
          out: 0,
          text: log.toString(),
          date: new Date(),
        });
      }
    );
    socket.on(
      'task-stderr',
      async ({
        id: taskId,
        log,
      }: {
        id: string;
        serviceName: string;
        log: Buffer;
      }) => {
        await TaskLog.add({
          id: taskId,
          out: 1,
          text: log.toString(),
          date: new Date(),
        });
      }
    );

    /**
     * Runner signal server that a service is unknown (happen when server ask runner to stop service)
     */
    socket.on('unknown-service', async ({ name }: { name: string }) => {
      if (!servicesWorkflow.has(name)) {
        logger.warn(
          `runner '${runnerId}' is signaling to not know service '${name}' but service does not exists in state`
        );
        return;
      }

      const service = servicesWorkflow.get(name);
      if (service.state.assigned_runner_id === runnerId) {
        // Runner restarted and all assigned taks were lost ?
        await Task.update.stopRelicas(name, logger);
      } else {
        logger.warn(
          `runner '${runnerId}' is signaling to not know service '${name}' but service is not assigned to this runner`
        );
      }
    });
  });

  io.listen(config.get('runner.port'));
  logger.info(`Listening to ws://localhost:${config.get('runner.port')}`);

  /**
   * shutdown callback
   */
  return async () => {
    io.disconnectSockets(true);
    logger.info(`runner sockets all disconnected`);
    return new Promise<void>((resolve, reject) => {
      io.close((err) => {
        if (!err) {
          logger.info(`runner socket.io server closed`);
          resolve();
        } else {
          logger.error(`runner socket.io server failed to closed`);
          reject(err);
        }
      });
    });
  };
};
