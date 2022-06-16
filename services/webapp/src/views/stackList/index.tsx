import { useQuery } from 'react-query';
import { Outlet, useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { BaseCard } from 'components/card';
import { NoStyleLink } from 'components/noStyleLink';
import { Text } from 'components/text';
import { API } from 'configs';
import { useSubscribeStacks } from 'hooks/query';
import { styles } from 'styles/css';

import { StackCard } from './stackCard';

const ViewContainer = styled.div`
  ${styles.container.noScroll};
  ${styles.padding.lg};
  padding-left: 0;
  box-sizing: border-box;

  ${styles.transition.default};
  flex-grow: 1;
  flex-shrink: 2;
  min-width: 0px;
  max-width: 500px;
  flex-shrink: 5;
  max-width: 190px;
  min-width: 100px;
`;

const ContainerCard = styled(BaseCard)`
  ${styles.container.noScroll};
  ${styles.padding.sm};
`;

const ServiceList = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;
const ServiceItem = styled.div``;

export const StackListView = () => {
  const { data, error } = useQuery('stacks', () => API.stack.list());
  useSubscribeStacks();

  const stackMatch = useMatch('/stack/:name/*');

  return (
    <>
      <ViewContainer>
        <ContainerCard t="secondary">
          {Boolean(error) && (
            <Text t="error">
              {error instanceof Error ? error.message : null}
            </Text>
          )}
          <ServiceList>
            {data &&
              data.map((stack) => (
                <ServiceItem key={stack.name}>
                  <NoStyleLink
                    to={`/stack/${stack.name}`}
                    onClick={(e) => {
                      if (stackMatch && stack.name === stackMatch.params.name) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <StackCard
                      active={Boolean(
                        stackMatch && stackMatch.params.name === stack.name
                      )}
                      stack={stack}
                    />
                  </NoStyleLink>
                </ServiceItem>
              ))}
          </ServiceList>
        </ContainerCard>
      </ViewContainer>
      <Outlet />
    </>
  );
};
