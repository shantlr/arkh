import { ServiceTaskLog } from 'configs/types';
import { useService, useServiceTaskLogs, useServiceTasks } from 'hooks/query';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Logs } from '../logs';

const ContainerOuter = styled.div`
  height: 100%;
  width: 100%;
  padding: ${(props) => props.theme.space.sm};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const ContainerInner = styled.div`
  background-color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div``;

export const ServiceLogs = ({ fullName }: { fullName: string }) => {
  const { data: service } = useService(fullName);
  const { data: tasks } = useServiceTasks(fullName);

  const [taskId, setTaskId] = useState(() =>
    tasks && tasks.length > 0 ? tasks[0].id : null
  );

  const { data: taskLogs } = useServiceTaskLogs(taskId);

  useEffect(() => {
    if (!taskId && tasks && tasks.length > 0) {
      // auto select first task
      setTaskId(tasks[0].id);
    } else if (
      taskId &&
      tasks &&
      tasks.findIndex((t) => t.id === taskId) === -1
    ) {
      // if selected taskId not found => reset
      setTaskId(tasks.length ? tasks[0].id : null);
    }
  }, [taskId, tasks]);

  return (
    <ContainerOuter>
      <ContainerInner>
        <Header>{Boolean(service) && service.key}</Header>
        {Boolean(taskId) && Boolean(taskLogs) && (
          <Logs logBatches={taskLogs as ServiceTaskLog[]} showTimestamp />
        )}
      </ContainerInner>
    </ContainerOuter>
  );
};
