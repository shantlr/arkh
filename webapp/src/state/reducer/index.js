import { composeReducer, initState } from 'compose-reducer';
import { cacheReducer, opNormalized } from 'lib/cache';
import { opBase, opRef } from 'lib/cache/redux/utils';

export const reducer = composeReducer(
  initState({
    cache: {},
  }),
  cacheReducer({
    reducers: {
      'command-task': (dataAccessor, { type, task }) => {
        if (type === 'created') {
          const tasks =
            dataAccessor.get('command-tasks', task.command_id) || [];

          dataAccessor.update(
            opNormalized({
              key: 'command-tasks',
              itemKey: 'task',
              params: task.command_id,
              value: [task],
            })
          );
          dataAccessor.update(
            opBase('command-last-task', task.command_id, opRef('task', task.id))
          );

          // dataAccessor.update();
          // console.log(tasks);
        } else if (type === 'ended') {
          dataAccessor.update();
        }
        console.log(dataAccessor, type, task);
      },
    },
  })
);
