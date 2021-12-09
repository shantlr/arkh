import { useParams } from 'react-router';
import { TaskLogs } from 'views/taskLogs';

export const TaskDetails = () => {
  const { taskId } = useParams();

  if (!taskId) {
    return null;
  }

  return <TaskLogs taskId={taskId} />;
};
