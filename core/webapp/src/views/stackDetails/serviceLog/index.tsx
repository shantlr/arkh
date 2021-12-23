import { CSSProperties, useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import styled from 'styled-components';

import { ServiceTaskLog } from 'configs/types';
import {
  useScubscribeServiceTaskLogs,
  useService,
  useServiceTaskLogs,
  useServiceTasks,
  useSubscribeServiceTasks,
} from 'hooks/query';
import { Logs } from '../logs';
import { ServiceName } from './serviceName';
import { useMemo } from 'react';
import { Duration } from 'components/duration';
import { styles } from 'styles/css';

const ContainerOuter = styled.div`
  height: 100%;
  width: 100%;
  padding: ${(props) => props.theme.space.sm};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
const HeaderNote = styled.div`
  z-index: 1;
  display: flex;
  align-items: center;
  ${styles.ml.md};
  ${styles.text.sm};
  pointer-events: none;
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

const ServiceTaskLogs = ({ taskId }: { taskId: string }) => {
  const { data: taskLogs } = useServiceTaskLogs(taskId);
  useScubscribeServiceTaskLogs(taskId);

  return (
    <Logs logBatches={(taskLogs as ServiceTaskLog[]) || []} showTimestamp />
  );
};

export const ServiceLogs = ({
  style,
  dragType,
  fullName,

  rowIndex,
  cellIndex,

  defaultTaskId,
}: {
  style?: CSSProperties;
  dragType: string;
  fullName: string;
  rowIndex?: number;
  cellIndex?: number;

  defaultTaskId?: string;
}) => {
  const { data: service } = useService(fullName);
  const { data: tasks } = useServiceTasks(fullName);

  const [taskId, setTaskId] = useState(() => {
    if (defaultTaskId) {
      return defaultTaskId;
    }
    return tasks && tasks.length > 0 ? tasks[0].id : null;
  });

  const [, drag, dragPreview] = useDrag(
    {
      type: dragType,
      item: {
        id: fullName,
        taskId,
        rowIndex,
        cellIndex,
      },
    },
    [rowIndex, cellIndex, fullName, taskId]
  );

  const currentTask = useMemo(() => {
    if (taskId && tasks) {
      return tasks.find((t) => t.id === taskId);
    }
    return null;
  }, [taskId, tasks]);
  const isMostRecentSelected = useMemo(() => {
    if (!taskId || !tasks || !tasks.length) {
      return false;
    }
    return taskId === tasks[0].id;
  }, [taskId, tasks]);
  useSubscribeServiceTasks(fullName, {
    onNewTask(task) {
      if (isMostRecentSelected) {
        setTaskId(task.id);
      }
    },
  });

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
    dragPreview(getEmptyImage());
  }, [dragPreview]);

  return (
    <ContainerOuter style={style}>
      <ContainerInner>
        <Header>
          {service && (
            <>
              <ServiceName
                name={fullName}
                service={service}
                tasks={tasks}
                selectedTaskId={taskId}
                onSelectTask={(taskId) => {
                  setTaskId(taskId);
                }}
              />
            </>
          )}
          {currentTask && (
            <HeaderNote>
              <Duration
                from={currentTask.creating_at}
                to={currentTask.stopped_at || currentTask.exited_at}
              />
            </HeaderNote>
          )}
          <DragHandle ref={drag} />
        </Header>
        {taskId && <ServiceTaskLogs taskId={taskId} />}
        {!taskId && <Logs logBatches={[]} showTimestamp />}
      </ContainerInner>
    </ContainerOuter>
  );
};
