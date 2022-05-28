import { Outlet, useParams } from 'react-router';
import styled from 'styled-components';
import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import { Text } from 'components/text';
import { Button } from 'components/button';
import { BaseCard } from 'components/card';
import { NoStyleLink } from 'components/noStyleLink';
import { useStack, useStackTabs } from 'hooks/query';
import { StackTabs } from './tabs';
import { styles } from 'styles/css';

const Container = styled.div`
  background-color: white;
  box-sizing: border-box;
  min-width: 500px;
  height: 100%;

  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  ${styles.mb.sm};
  ${styles.pl.sm};
  ${styles.flex.vertCenter}
`;

export const StackDetails = memo(() => {
  const { name } = useParams();

  const { data: stack, error: stackError } = useStack(name as string);
  const { data: tabs } = useStackTabs(name as string);

  return (
    <>
      <BaseCard style={{ width: '100%', flexGrow: 3, paddingLeft: 0 }}>
        <Container>
          <Header>
            <NoStyleLink to="/stack">
              <Button rounded>
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </NoStyleLink>
            {stack && (
              <Text size="md" style={{ marginLeft: 5 }}>
                {stack.name}
              </Text>
            )}
            {stackError && (
              <Text t="error">
                {stackError instanceof Error ? stackError.message : null}
              </Text>
            )}
          </Header>
          {stack && tabs && <StackTabs stack={stack} tabs={tabs} />}
        </Container>
      </BaseCard>
      <Outlet />
    </>
  );
});
