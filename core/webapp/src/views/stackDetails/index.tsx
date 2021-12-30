import { Outlet, useParams } from 'react-router';
import styled from 'styled-components';
import { Text } from 'components/text';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'components/button';
import { BaseCard } from 'components/card';
import { NoStyleLink } from 'components/noStyleLink';
import { useStack, useStackTabs } from 'hooks/query';
import { StackTabs } from './tabs';

const Container = styled.div`
  background-color: white;
  box-sizing: border-box;
  min-width: 500px;
  height: 100%;

  display: flex;
  flex-direction: column;
`;

export const StackDetails = () => {
  const { name } = useParams();

  const { data: stack } = useStack(name as string);
  const { data: tabs } = useStackTabs(name as string);

  return (
    <>
      <BaseCard style={{ width: '100%', flexGrow: 3, paddingLeft: 0 }}>
        <Container>
          <div style={{ marginBottom: 5 }}>
            <NoStyleLink to="/stack">
              <Button rounded>
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </NoStyleLink>
            {Boolean(stack) && (
              <Text style={{ marginLeft: 5 }}>{stack.name}</Text>
            )}
          </div>
          {tabs && <StackTabs stackName={stack.name} tabs={tabs} />}
        </Container>
      </BaseCard>
      <Outlet />
    </>
  );
};
