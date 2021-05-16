import { Server, Socket } from 'socket.io';
import { MESSAGES } from '../../pubsub';

/**
 *
 * @param {Object} input
 * @param {Server} input.io
 */
export const setupClientSubscription = async ({ io }) => {
  MESSAGES.command.created.subscribe((cmd) => {
    io.in('subscribe-commands').emit('publish-command', {
      type: 'created',
      command: cmd,
    });
  });
  MESSAGES.command.deleted.subscribe((cmd) => {
    io.in('subscribe-commands').emit('publish-command', {
      type: 'deleted',
      commandId: cmd.id,
    });
  });
  MESSAGES.command.updated.subscribe((cmd) => {
    io.in('subscribe-commands').emit('publish-command', {
      type: 'updated',
      command: cmd,
    });
  });

  MESSAGES.runner.connected.subscribe(() => {
    const number = io.of('runner').sockets.size;
    io.in('subscribe-runner-available').emit(
      'publish-runner-available',
      number > 0
    );
  });
  MESSAGES.runner.disconnected.subscribe(() => {
    const number = io.of('runner').sockets.size;
    io.in('subscribe-runner-available').emit(
      'publish-runner-available',
      number > 0
    );
  });
};

/**
 *
 * @param {Object} input
 * @param {Socket} input.socket
 * @param {Server} input.io
 */
export const setupClientSocket = ({ io, socket }) => {
  socket.on('subscribe-commands', () => {
    socket.join('subscribe-commands');
  });
  socket.on('unsubscribe-commands', () => {
    socket.leave('subscribe-commands');
  });

  socket.on('subscribe-runner-available', () => {
    socket.join('subscribe-runner-available');
    // send current state on subscribe
    socket.emit('publish-runner-available', io.of('runner').sockets.size > 0);
  });
  socket.on('unsubscribe-runner-available', () => {
    socket.leave('runner-available');
  });

  socket.on('subscribe-command-logs', ({ commandId }) => {
    socket.join(`subscribe-command-logs:${commandId}`);
  });
  socket.on('unsubscribe-command-logs', ({ commandId }) => {
    socket.leave(`subscribe-command-logs:${commandId}`);
  });
};
