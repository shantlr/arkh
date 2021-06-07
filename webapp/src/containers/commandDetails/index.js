import { Spinner } from '@chakra-ui/spinner';
import dayjs from 'dayjs';
import { useCommandTasks, useTask } from 'hooks';

const Task = ({ taskId }) => {
  const task = useTask(taskId);
  console.log(task);
  return (
    <div>
      <span className="text-xs">
        {dayjs(task.created_at).format('DD/MM/YYYY HH:mm')}
      </span>
    </div>
  );
};

export const CommandDetails = ({ commandId }) => {
  const { data } = useCommandTasks(commandId);

  if (!data) {
    return null;
  }

  return (
    <div className="bg-gray-100 p-4" style={{ width: 500 }}>
      <div className="bold text-gray-600">Historic</div>
      {data.map((id) => (
        <Task key={id} taskId={id} />
      ))}
    </div>
  );
};
