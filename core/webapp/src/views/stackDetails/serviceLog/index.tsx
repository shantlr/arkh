import { ServiceTaskLog } from 'configs/types';
import { useService, useServiceTaskLogs, useServiceTasks } from 'hooks/query';
import { CSSProperties, useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import styled from 'styled-components';
import { Logs } from '../logs';
import { ServiceName } from './serviceName';

const ContainerOuter = styled.div`
  height: 100%;
  width: 100%;
  padding: ${(props) => props.theme.space.sm};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const ContainerInner = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  position: relative;
`;
const DragHandle = styled.div`
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
  style,
  dragType,
  fullName,

  rowIndex,
  cellIndex,
}: {
  style?: CSSProperties;
  dragType: string;
  fullName: string;
  rowIndex?: number;
  cellIndex?: number;
}) => {
  const { data: service } = useService(fullName);
  const { data: tasks } = useServiceTasks(fullName);
  const [, drag, dragPreview] = useDrag(
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

  // auto select first task
  useEffect(() => {
    if (!taskId && tasks && tasks.length > 0) {
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

  // disable default preview
  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  return (
    <ContainerOuter style={style}>
      <ContainerInner>
        <Header>
          {service && (
            <ServiceName
              service={service}
              tasks={tasks}
              selectedTaskId={taskId}
              onSelectTask={(taskId) => {
                setTaskId(taskId);
              }}
            />
          )}
          <DragHandle ref={drag} />
        </Header>
        {Boolean(taskId) && Boolean(taskLogs) && (
          <Logs logBatches={taskLogs as ServiceTaskLog[]} showTimestamp />
        )}
      </ContainerInner>
    </ContainerOuter>
  );
};
