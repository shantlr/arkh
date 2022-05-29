import { Server } from 'socket.io';
import { ServiceSpec } from '@shantlr/shipyard-common-types';

import { baseLogger, config } from '../config';
import { State } from '../data/state';
import { RunnerType } from './class';
import { Task, TaskLog } from '../data';
import { runnersWorkflow } from '../workflow';

export const startRunnerWs = async ({
  logger = baseLogger.extend('ws:runner'),
} = {}) => {
  const io = new Server({});

  io.on('connection', (socket) => {
    let runnerId = null;
    socket.on('runner-ready', (event: { id: string; type: RunnerType }) => {
      runnerId = event.id;

      const existing = State.runner.get(runnerId);
      if (existing && existing.state === 'ready') {
        logger.warn(`runner '${runnerId}' already connected`);
        socket.emit('force-runner-exit', {
          reason: 'already-connected',
        });
        return;
      }
      State.runner.ready({
        id: event.id,
        type: event.type,
        socket,
      });

      runnersWorkflow.get(runnerId).actions.joined();
    });

    socket.on('disconnect', () => {
      logger.info(`'${runnerId}' disconnected`);
      if (runnerId) {
        State.runner.disconnected(runnerId);
      }
    });
    socket.on('runner-leave', ({ reason }: { reason: string }, ack) => {
      logger.info(`runner '${runnerId}' is leaving: ${reason}`);
      State.runner.leave(runnerId);
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
        const service = State.service.get(serviceName);
        if (!service) {
          logger.info(
            `task-state not updated: service '${serviceName}' not found`
          );
          return;
        }

        if (service.assignedRunnerId !== runnerId) {
          logger.error(
            `WARNING: task started by runner '${runnerId}' but is assigned to '${service.assignedRunnerId}'`
          );
        }

        switch (state) {
          case 'creating': {
            State.service.toTaskCreating(taskId, serviceName);
            await Task.create({
              id: taskId,
              serviceName,
              serviceSpec: spec,
              runnerId,
            });
            break;
          }
          case 'running': {
            State.service.toTaskRunning(taskId, serviceName);
            await Task.update.runningAt(taskId);
            break;
          }
          case 'stopping': {
            State.service.toTaskStopping(taskId, serviceName);
            await Task.update.stoppingAt(taskId);
            break;
          }
          case 'stopped': {
            State.service.toTaskStopped(taskId, serviceName);
            await Task.update.stoppedAt(taskId);
            break;
          }
          case 'exited': {
            State.service.toTaskExited(taskId, serviceName);
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

    socket.on('unknown-service', async ({ name }: { name: string }) => {
      const serviceState = State.service.get(name);
      if (serviceState) {
        if (serviceState.assignedRunnerId === runnerId) {
          await Task.update.stopRelicas(name, logger);
        } else {
          logger.warn(
            `runner '${runnerId}' is signaling to not know service '${name}' but service is not assigned to this runner`
          );
        }
      } else {
        logger.warn(
          `runner '${runnerId}' is signaling to not know service '${name}' but service does not exists in state`
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
