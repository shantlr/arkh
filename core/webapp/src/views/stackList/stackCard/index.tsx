import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/button';
import { BaseCard } from 'components/card';
import { Text } from 'components/text';
import { API } from 'configs';
import { Stack } from 'configs/types';
import { useStackServiceStates, useSubscribeServiceStates } from 'hooks/query';
import { map } from 'lodash';
import { useMutation } from 'react-query';
import styled, { css } from 'styled-components';
import { StackStatusIndicator } from './indicator';
import { RunStack } from './runStack';

const StackCardContainer = styled(BaseCard)<{ active?: boolean }>`
  padding: ${(props) => props.theme.space.lg};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  margin-bottom: ${(props) => props.theme.space.md};

  cursor: pointer;
  transition: all 0.5s;

  :hover {
    opacity: 1;
    box-shadow: ${(props) => props.theme.shadow.md};
  }
`;

const StackHeader = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  flex-wrap: nowrap;
  margin-bottom: ${(props) => props.theme.space.md};
`;
const StackHeaderActions = styled.div``;
const StackTitle = styled.div`
  flex-grow: 1;
  ${(props) => props.theme.color.title};
  font-weight: bold;
`;
const ServiceList = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const stateCss = {
  running: css`
    border-color: transparent;
    background-color: ${(props) => props.theme.color.success};
    color: ${(props) => props.theme.color.successColor};
  `,
  exited: css`
    border-color: transparent;
    background-color: ${(props) => props.theme.color.mainBg};
    color: ${(props) => props.theme.color.text};
  `,
};

const ServiceItem = styled.div<{ state?: keyof typeof stateCss }>`
  margin-right: ${(props) => props.theme.space.md};
  padding: ${(props) => props.theme.space.sm};
  margin-bottom: 2px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.3s;
  min-width: 65px;
  display: flex;
  justify-content: space-between;
  color: ${(props) => props.theme.color.text};
  ${(props) => (props.state ? stateCss[props.state] : null)};

  border: 1px solid ${(props) => props.theme.color.mainBg};

  :hover {
    border-color: transparent;
    color: ${(props) => props.theme.color.text};
    background-color: ${(props) => props.theme.color.mainHighlightBg};
    box-shadow: ${(props) => props.theme.shadow.md};
  }
`;

export const StackCard = ({
  active,
  stack,
}: {
  active: boolean;
  stack: Stack;
}) => {
  const { mutate: runService } = useMutation(
    ({ serviceName }: { serviceName: string }) =>
      API.service.run({ name: serviceName })
  );

  const { data: serviceStates } = useStackServiceStates(stack.name);
  useSubscribeServiceStates(stack.name);

  return (
    <StackCardContainer active={active}>
      <StackHeader>
        <StackStatusIndicator serviceStates={serviceStates} />
        <StackTitle>{stack.name}</StackTitle>
        <StackHeaderActions>
          <RunStack stackName={stack.name} />
        </StackHeaderActions>
      </StackHeader>
      <ServiceList>
        {map(stack.spec.services, (service, serviceKey) => (
          <ServiceItem
            key={serviceKey}
            state={
              serviceStates && serviceStates[serviceKey]
                ? serviceStates[serviceKey].current_task_state
                : 'off'
            }
          >
            <Text style={{ marginRight: 5 }}>{serviceKey}</Text>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                runService({
                  serviceName: `${stack.name}.${serviceKey}`,
                });
              }}
            >
              <FontAwesomeIcon icon={faPlay} />
            </Button>
          </ServiceItem>
        ))}
      </ServiceList>
    </StackCardContainer>
  );
};
