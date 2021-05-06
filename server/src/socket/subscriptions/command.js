import { createRoomSubscription } from '../utils';

export const cmdState = createRoomSubscription('command-state', {
  room: (key, { id }) => `${key}:${id}`,
});
export const cmdLogs = createRoomSubscription('command-logs', {
  room: (key, { id }) => `${key}:${id}`,
  onJoin() {},
  onLeave() {},
});
