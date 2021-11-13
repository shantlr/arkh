import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useCommandLastTask, useSubscribeTaskLogs, useTaskLogs } from 'hooks';
import { useState } from 'react';

const Title = ({ task }) => {
  if (task.ended_at) {
    return (
      <span>
        Ended at {dayjs(task.ended_at).format('DD/MM/YYYY HH:mm:ss')} (
        {task.result.code})
      </span>
    );
  }

  if (task.created_at) {
    return (
      <span>
        Started at {dayjs(task.created_at).format('DD/MM/YYYY HH:mm:ss')}
      </span>
    );
  }

  return null;
};

const CommandLogs = ({ className, taskId }) => {
  useSubscribeTaskLogs(taskId);
  const logs = useTaskLogs(taskId);

  return (
    <div className={classNames('text-white bg-black p-1', className)}>
      {Boolean(logs) &&
        logs.map((log) => (
          <div key={log.id} className="whitespace-pre">
            {log.log}
          </div>
        ))}
    </div>
  );
};

export const CommandLastTask = ({ className, commandId }) => {
  const lastTask = useCommandLastTask(commandId);
  const [showLogs, setShowLogs] = useState();

  if (!lastTask) {
    return null;
  }

  return (
    <div className={classNames('text-xs text-gray-400', className)}>
      <div
        onClick={() => setShowLogs(!showLogs)}
        className={classNames('cursor-pointer border-l-4 rounded pl-1', {
          'border-blue-500': !lastTask.result,
          'border-green-500': lastTask.result && lastTask.result.code === 0,
          'border-red-500': lastTask.result && lastTask.result.code !== 0,
        })}
      >
        <Title task={lastTask} />
        <FontAwesomeIcon
          className={classNames('ml-2 transition', {
            'transform rotate-180': !showLogs,
          })}
          icon={faCaretDown}
        />
      </div>

      {showLogs && <CommandLogs className="mt-1" taskId={lastTask.id} />}
    </div>
  );
};
