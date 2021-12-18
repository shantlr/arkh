import { ServiceTaskLog } from 'configs/types';
import { useService, useServiceTaskLogs, useServiceTasks } from 'hooks/query';
import { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import styled from 'styled-components';
import { LogContainer, Logs } from '../logs';

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

const Header = styled.div`
  display: flex;
  position: relative;
`;
const ServiceName = styled.div`
  border: 2px solid transparent;
  border-bottom: none;
  border-top-left-radius: ${(props) => props.theme.borderRadius.md};
  border-top-right-radius: ${(props) => props.theme.borderRadius.md};
  padding: 0 8px;
  border-left-color: black;
  border-top-color: black;
  border-right-color: black;
  z-index: 1;
  background-color: white;
`;
const Handle = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 0;
  border-top-left-radius: ${(props) => props.theme.borderRadius.md};
  border-top-right-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;

  background-color: transparent;
  transition: 0.3s;
  :hover {
    background-color: gray;
  }
`;
export const ServiceLogs = ({
  dragType,
  fullName,

  rowIndex,
  cellIndex,
}: {
  dragType: string;
  fullName: string;
  rowIndex?: number;
  cellIndex?: number;
}) => {
  const { data: service } = useService(fullName);
  const { data: tasks } = useServiceTasks(fullName);
  const [col, drag, dragPreview] = useDrag(
    {
      type: dragType,
      item: {
        id: fullName,
        rowIndex,
        cellIndex,
      },
    },
    [rowIndex, cellIndex, fullName]
  );

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
    <ContainerOuter ref={dragPreview}>
      <ContainerInner>
        <Header>
          {Boolean(service) && <ServiceName>{service.key}</ServiceName>}
          <Handle ref={drag} />
        </Header>
        {Boolean(taskId) && Boolean(taskLogs) && (
          <Logs logBatches={taskLogs as ServiceTaskLog[]} showTimestamp />
        )}
      </ContainerInner>
    </ContainerOuter>
  );
};
