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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

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

const HeaderActions = styled.div`
  margin-left: auto;
  z-index: 1;
  ${styles.flex.bothCenter};
  ${styles.pr.sm};
`;
const HeaderActionItem = styled.div<{ active?: boolean }>`
  cursor: pointer;
  ${(props) => (props.active ? styles.color.actionBg : null)};
  ${styles.text.sm};
  ${styles.hover.textAction};
  ${styles.transition.default};
  ${styles.ml.md};
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

const ServiceTaskLogs = ({
  taskId,
  showTimestamp = false,
  showTimeDelta = false,
  formatJson = false,
}: {
  taskId: string;
  showTimestamp?: boolean;
  showTimeDelta?: boolean;
  formatJson?: boolean;
}) => {
  const { data: taskLogs } = useServiceTaskLogs(taskId);
  useScubscribeServiceTaskLogs(taskId);

  return (
    <Logs
      key={taskId}
      logBatches={(taskLogs as ServiceTaskLog[]) || []}
      showTimestamp={showTimestamp}
      showTimeDelta={showTimeDelta}
      formatJson={formatJson}
    />
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

  showTimestamp?: boolean;

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
  // disable default preview
  useEffect(() => {
    dragPreview(getEmptyImage());
  }, [dragPreview]);

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

  const [showTimestamp, setShowTimestamp] = useState(() =>
    service ? service.spec.logs.time === true : null
  );
  const [showTimeDelta, setTimeDelta] = useState(() =>
    service ? service.spec.logs.delta === true : null
  );
  const [formatJson, setFormatJson] = useState(() =>
    service ? service.spec.logs.json === true : null
  );

  useEffect(() => {
    if (service) {
      console.log('naoetuhao', service);
      if (showTimestamp === null) {
        setShowTimestamp(service.spec.logs.time === true);
      }
      if (showTimeDelta === null) {
        setTimeDelta(service.spec.logs.delta === true);
      }
      if (formatJson === null) {
        setFormatJson(service.spec.logs.json === true);
      }
    }
  }, [service]);

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
          <HeaderActions>
            <HeaderActionItem
              active={formatJson || false}
              onClick={() => {
                setFormatJson(!formatJson);
              }}
            >
              <span style={{ fontWeight: 'bold' }}>{'{ }'}</span>
            </HeaderActionItem>
            <HeaderActionItem
              active={showTimestamp || false}
              onClick={() => {
                setShowTimestamp(!showTimestamp);
              }}
            >
              <FontAwesomeIcon icon={faClock} />
            </HeaderActionItem>
            <HeaderActionItem
              active={showTimeDelta || false}
              onClick={() => {
                setTimeDelta(!showTimeDelta);
              }}
            >
              <FontAwesomeIcon icon={faCalendarAlt} />
            </HeaderActionItem>
          </HeaderActions>
          <DragHandle ref={drag} />
        </Header>
        {taskId && (
          <ServiceTaskLogs
            taskId={taskId}
            showTimestamp={showTimestamp || false}
            showTimeDelta={showTimeDelta || false}
            formatJson={formatJson || false}
          />
        )}
        {!taskId && <Logs logBatches={[]} />}
      </ContainerInner>
    </ContainerOuter>
  );
};
