import React from 'react';
import { useMemo } from 'react';

import { faPlay, faStopCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ServiceInfo, ServiceState } from '@shantlr/shipyard-common-types';
import { map } from 'lodash';
import { useMutation } from 'react-query';
import styled, { css } from 'styled-components';

import { DateFromNow } from 'components/dateFromNow';
import { Select } from 'components/select';
import { Text } from 'components/text';
import { API } from 'configs';
import { ServiceTask } from 'configs/types';
import { styles } from 'styles/css';

const StyledSelect = styled(Select)`
  z-index: 1;
`;

const Container = styled.div`
  min-width: 50px;
  border: 2px solid transparent;
  border-bottom: none;
  padding: 0 ${(props) => props.theme.space.md};
  ${styles.roundedTopLeft.md};
  ${styles.roundedTopRight.md};
  ${styles.pl.sm};
  border-left-color: ${(props) => props.theme.logs.bg};
  border-top-color: ${(props) => props.theme.logs.bg};
  border-right-color: ${(props) => props.theme.logs.bg};
  ${styles.bg.mainBg};

  display: flex;
  align-items: center;
`;
const Name = styled(Text)`
  ${styles.mr.md};
`;

const ActionContainer = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;

  ${styles.text.sm};
`;
const ActionItem = styled.div`
  ${styles.transition.default};
  ${styles.hover.textAction};
  cursor: pointer;
`;

const statusCss = {
  stopped: css`
    background-color: ${(p) => p.theme.color.secondaryMainBg};
  `,
  'pending-assignment': css`
    ${styles.bg.warning}
  `,
  exited: css`
    background-color: ${(p) => p.theme.color.secondaryMainBg};
  `,
  running: css`
    background-color: ${(p) => p.theme.color.success};
  `,
  default: css`
    background-color: transparent;
  `,
};
const Status = styled.div<{
  state?: keyof typeof statusCss | null;
}>`
  ${(props) => statusCss[props.state || 'default']};
  min-width: 8px;
  min-height: 8px;
  ${styles.rounded.round};
  ${styles.mr.sm};
  ${styles.transition.default};
`;

export const ServiceName = React.forwardRef<
  HTMLDivElement,
  {
    name: string;
    service: ServiceInfo & { state: ServiceState };
    tasks: ServiceTask[] | undefined;
    selectedTaskId?: string | null;
    onSelectTask: (taskId: string) => void;
  }
>(({ name, service, tasks, selectedTaskId, onSelectTask }, ref) => {
  const options = useMemo(() => {
    return map(tasks, (task) => ({
      key: task.id,
      value: task.id,
      label: (
        <Text size="xs">
          <DateFromNow date={task.creating_at} />
          {typeof task.exit_code === 'number' ? ` (${task.exit_code})` : null}
        </Text>
      ),
    }));
  }, [tasks]);

  const { mutate: runService } = useMutation(() => API.service.run({ name }));
  const { mutate: stopService } = useMutation(() => API.service.stop({ name }));

  const currentTask = useMemo(() => {
    if (!selectedTaskId || !tasks) {
      return null;
    }
    return tasks.find((t) => t.id === selectedTaskId);
  }, [selectedTaskId, tasks]);

  const currentTaskState = useMemo(() => {
    if (service.state?.state === 'pending-assignment') {
      return 'pending-assignment';
    }
    if (!currentTask) {
      return null;
    }
    if (currentTask.exited_at) {
      return 'exited';
    }
    if (currentTask.stopped_at) {
      return 'stopped';
    }
    return 'running';
  }, [currentTask, service.state?.state]);

  const isRunning = useMemo(() => {
    if (!tasks) {
      return null;
    }
    if (tasks.length) {
      const task = tasks[0];
      if (task.running_at && !task.exited_at && !task.stopped_at) {
        return true;
      }
    }
    if (currentTaskState === 'pending-assignment') {
      return true;
    }
    return false;
  }, [currentTaskState, tasks]);

  return (
    <StyledSelect
      selected={selectedTaskId}
      placement="left-start"
      options={options}
      onSelect={(task) => onSelectTask(task.value)}
    >
      <Container ref={ref}>
        <Status
          title={currentTaskState || undefined}
          state={currentTaskState}
        />
        <Name size="sm">{service.key}</Name>
        <ActionContainer>
          {isRunning === false && (
            <ActionItem onClick={() => runService()}>
              <FontAwesomeIcon icon={faPlay} />
            </ActionItem>
          )}
          {isRunning === true && (
            <ActionItem onClick={() => stopService()}>
              <FontAwesomeIcon icon={faStopCircle} />
            </ActionItem>
          )}
        </ActionContainer>
      </Container>
    </StyledSelect>
  );
});
