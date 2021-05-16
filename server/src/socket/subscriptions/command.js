import { MESSAGES } from '../../triggers';
import { createRoomSubscription } from '../utils';

export const cmdState = createRoomSubscription(
  MESSAGES.command.state.updated.prefix,
  {
    init({ io }) {
      MESSAGES.command.state.updated.subscribe(({ id, state }) => {
        io.of(MESSAGES.command.state.updated.key(id)).emit('publish', {
          key: MESSAGES.command.state.updated.key(id),
          id,
          state,
        });
      });
    },
    // room: (key, { id }) => `${key}:${id}`,
  }
);
export const cmdLogs = createRoomSubscription('command-logs', {
  room: (key, { id }) => `${key}:${id}`,
});
