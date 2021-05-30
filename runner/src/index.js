import { io } from 'socket.io-client';

import { debug } from './debug';
import { deleteCommand, getCommand, setCommand } from './data';
import { CMD_JOBS, commandTaskQueue, pushCommandTaskJob } from './queue';

const socket = io('ws://localhost:3005/runner', {
  path: '/socket',
});
export const getSocket = () => socket;

socket.on('connect', () => {
  debug('connected');
});
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    debug('disconnected by server, retrying connection in 3s');
    setTimeout(() => {
      socket.connect();
    }, 3000);
  } else {
    debug('disconnected %s', reason);
  }
});
socket.on('reconnect', () => {
  debug('reconnected');
});

socket.on('update-command', (cmd) => {
  setCommand(cmd);
  debug(`command ${cmd.name} (${cmd.id}) updated`);
});
socket.on('remove-command', (cmdId) => {
  const cmd = getCommand(cmdId);
  if (cmd) {
    deleteCommand(cmdId);
    debug(`command ${cmd.name} (${cmd.id}) deleted`);
  }
});

socket.on('command-exec', (task) => {
  debug(`command-exec '${task.command_id}' push exec`);
  pushCommandTaskJob(
    task.command_id,
    CMD_JOBS.exec({
      id: task.id,
      command_id: task.command_id,
    })
  );
});
socket.on('command-stop', (task) => {
  pushCommandTaskJob(
    task.command_id,
    CMD_JOBS.stop({
      id: task.id,
    })
  );
});

// START QUEUES
commandTaskQueue.start();

process.once('SIGUSR2', () => {
  socket.close();
  process.kill(process.pid, 'SIGUSR2');
});
