import { ServiceInfo } from '@shantr/metro-common-types';
import { Dropdown } from 'components/dropdown';
import { ServiceTask } from 'configs/types';
import { map } from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
import { DateFromNow } from 'components/dateFromNow';
import { Text } from 'components/text';

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

  cursor: pointer;
`;

export const ServiceName = ({
  service,
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
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

  return (
    <StyledDropdown
      selected={selectedTaskId}
      options={options}
      onSelect={(task) => onSelectTask(task.value)}
    >
      <Container>{service.key}</Container>
    </StyledDropdown>
  );
};
