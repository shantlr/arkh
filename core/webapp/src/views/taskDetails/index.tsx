import { useParams } from 'react-router';
import { TaskLogs } from 'views/taskLogs';

export const TaskDetails = () => {
  const { taskId, ...other } = useParams();
  console.log('task name', taskId, other);
  if (!taskId) {
    return null;
  }
  return <TaskLogs taskId={taskId} />;
};
