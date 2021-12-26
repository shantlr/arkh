import { ServiceInfo } from '@shantr/metro-common-types';
import { Dropdown } from 'components/dropdown';
import { ServiceTask } from 'configs/types';
import { map } from 'lodash';
import { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { DateFromNow } from 'components/dateFromNow';
import { Text } from 'components/text';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStopCircle } from '@fortawesome/free-solid-svg-icons';
import { styles } from 'styles/css';
import { useMutation } from 'react-query';
import { API } from 'configs';

const StyledDropdown = styled(Dropdown)`
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

  cursor: pointer;
`;
const Name = styled.div`
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
  min-width: 10px;
  min-height: 10px;
  ${styles.rounded.round};
  ${styles.mr.sm};
  ${styles.transition.default};
`;

export const ServiceName = ({
  name,
  service,
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  name: string;
  service: ServiceInfo;
  tasks: ServiceTask[] | undefined;
  selectedTaskId?: string | null;
  onSelectTask: (taskId: string) => void;
}) => {
  const options = useMemo(() => {
    return map(tasks, (task) => ({
      key: task.id,
      value: task.id,
      label: (
        <Text size="sm">
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
  }, [currentTask]);

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
    return false;
  }, [tasks]);

  return (
    <StyledDropdown
      selected={selectedTaskId}
      placement="left-start"
      options={options}
      onSelect={(task) => onSelectTask(task.value)}
    >
      <Container>
        <Status state={currentTaskState} />
        <Name>{service.key}</Name>
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
    </StyledDropdown>
  );
};
