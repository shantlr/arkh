import { composeReducer, initState } from 'compose-reducer';
import { cacheReducer } from 'lib/cache';
import { opBase, opNormalized, opRef } from 'lib/cache/redux/utils';

export const reducer = composeReducer(
  initState({
    cache: {},
  }),
  cacheReducer({
    reducers: {
      'command-task': (dataAccessor, { type, task }) => {
        if (type === 'created') {
          // const tasks =
          //   dataAccessor.get('command-tasks', task.command_id) || [];

          dataAccessor.update(
            opNormalized({
              key: 'command-tasks',
              params: task.command_id,
              itemKey: 'task',
              value: [task],
            })
          );

          dataAccessor.update(
            opRef('command-last-task', task.command_id, 'task', task.id)
          );
        } else if (type === 'ended') {
          dataAccessor.update(opBase('task', task.id, task));
        }
      },
      'task-logs': (dataAccessor, { taskId, logs }) => {
        dataAccessor.update(opBase('task-logs', taskId, logs));
      },
    },
  })
);
