import { io } from 'socket.io-client';

import { debug } from './debug';
import { deleteCommand, getCommand, setCommand } from './data';
import { CMD_JOBS, getCommandQueue } from './queue';

const socket = io('ws://localhost:3005/runner', {
  path: '/socket',
});

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

socket.on('command-exec', (cmdId) => {
  const cmd = getCommand(cmdId);
  const queue = getCommandQueue(cmdId);

  if (!cmd) {
    debug(`command-exec '${cmdId}' not found. push get-and-exec`);
    queue.push(CMD_JOBS.getAndExec({ socket, cmdId }));
  } else {
    debug(`command-exec '${cmdId}' push exec`);
    queue.push(CMD_JOBS.exec({ socket, cmdId }));
  }
});
socket.on('command-stop', (cmdId) => {
  const cmd = getCommand(cmdId);
  if (!cmd) {
    debug(`command`);
    return;
  }

  const queue = getCommandQueue(cmdId);
  debug(`command-stop '${cmdId}' push stop`);
  queue.push(CMD_JOBS.stop({ socket, cmdId }));
});

process.once('SIGUSR2', () => {
  socket.close();
  process.kill(process.pid, 'SIGUSR2');
});
