import { API } from 'configs';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { Outlet, useMatch } from 'react-router-dom';
import { BaseCard } from 'components/card';
import { StackCard } from './stackCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompressAlt, faExpandAlt } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { NoStyleLink } from 'components/noStyleLink';
import { styles } from 'styles/css';
import { useSubscribeStacks } from 'hooks/query';
import { Text } from 'components/text';

const ViewContainer = styled.div<{ shrinked?: boolean }>`
  ${styles.container.noScroll};
  ${styles.padding.lg};
  padding-left: 0;
  box-sizing: border-box;

  ${styles.transition.default};
  flex-grow: 1;
  flex-shrink: 2;
  min-width: 0px;
  max-width: 500px;
  ${(props) =>
    props.shrinked
      ? `flex-shrink: 5; max-width: 190px; min-width: 100px; `
      : null};
`;

const ContainerCard = styled(BaseCard)<{ shrinked?: boolean }>`
  ${styles.container.noScroll};
  ${(props) => (props.shrinked ? styles.padding.sm : null)}
`;

const Header = styled.div`
  display: flex;
`;
const HeaderActionItem = styled.div`
  min-width: 18px;
  min-height: 18px;
  cursor: pointer;
  ${styles.text.sm};
  ${styles.base.mainBg};
  ${styles.rounded.round};
  ${styles.flex.bothCenter};
  ${styles.hover.action};
  ${styles.transition.default};
  ${styles.mb.md};
`;

const ServiceList = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;
const ServiceItem = styled.div<{ shrinked?: boolean }>``;

export const StackListView = () => {
  const [shrinked, setShrinked] = useState(true);
  const { data, error } = useQuery('stacks', () => API.stack.list());
  useSubscribeStacks();

  const stackMatch = useMatch('/stack/:name/*');

  return (
    <>
      <ViewContainer shrinked={shrinked}>
        <ContainerCard t="secondary" shrinked={shrinked}>
          {error && (
            <Text t="error">
              {error instanceof Error ? error.message : null}
            </Text>
          )}
          {Boolean(data) && (
            <Header>
              <HeaderActionItem onClick={() => setShrinked(!shrinked)}>
                <FontAwesomeIcon
                  icon={!shrinked ? faCompressAlt : faExpandAlt}
                />
              </HeaderActionItem>
            </Header>
          )}
          <ServiceList>
            {data &&
              data.map((stack) => (
                <ServiceItem key={stack.name} shrinked={shrinked}>
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
                      shrinked={shrinked}
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
