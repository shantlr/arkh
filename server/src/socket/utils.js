import { noop } from 'lodash';
import { Socket } from 'socket.io';

/**
 *
 * @param {string} key
 * @param {Object} option
 * @param {(key: string, input: { args: any[] }) => string} option.room
 * @param {(input: { socket: Socket, args: any[] }) => void} option.onJoin
 * @param {(input: { socket: Socket, args: any[] }) => void} option.onLeave
 * @returns
 */
export const createRoomSubscription = (
  key,
  { room, onJoin = noop, onLeave = noop } = {}
) => {
  const sub = {
    key,
    getRoomKey({ args }) {
      return room(key, ...args);
    },
    /**
     *
     * @param {Object} arg
     * @param {Socket} arg.socket
     * @param {any[]} arg.args
     */
    async join({ socket, args }) {
      const roomKey = sub.getRoomKey({ args });
      if (!socket.rooms.has(roomKey)) {
        await socket.join(roomKey);
        onJoin({ socket, args });
      }
    },
    /**
     *
     * @param {Object} arg
     * @param {Socket} arg.socket
     * @param {any[]} arg.args
     */
    async leave({ socket, args }) {
      const roomKey = sub.getRoomKey({ args });
      if (socket.rooms.has(room)) {
        await socket.leave(roomKey);
        onLeave({ socket, args });
      }
    },
  };

  return sub;
};
