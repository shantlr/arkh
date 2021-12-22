import { ServiceInfo } from '@shantr/metro-common-types';
import { Dropdown } from 'components/dropdown';
import { ServiceTask } from 'configs/types';
import { map } from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
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
  border-top-left-radius: ${(props) => props.theme.borderRadius.md};
  border-top-right-radius: ${(props) => props.theme.borderRadius.md};
  padding: 0 ${(props) => props.theme.space.md};
  border-left-color: black;
  border-top-color: black;
  border-right-color: black;
  background-color: white;

  display: flex;
  align-items: center;

  cursor: pointer;
`;
const Name = styled.div``;

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
