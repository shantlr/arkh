import { API } from 'configs';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { Link, Outlet, useMatch } from 'react-router-dom';
import { BaseCard } from 'components/card';
import { StackCard } from './stackCard';

const Container = styled.div`
  width: 100%;
  height: 100%;
  min-width: 250px;
  flex-grow: 1;
  flex-shrink: 2;

  padding: ${(props) => props.theme.space.lg};
  padding-left: 0;
  box-sizing: border-box;
  background-color: white;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const ContainerCard = styled(BaseCard)`
  height: 100%;
`;

export const StackListView = ({
  children,
  ...props
}: {
  children?: JSX.Element;
}) => {
  const { data } = useQuery('stacks', () => API.stack.list());

  const stackMatch = useMatch('/stack/:name/*');

  return (
    <>
      <Container>
        <ContainerCard t="main">
          {data &&
            data.map((stack) => (
              <Link
                key={stack.name}
                style={{ textDecoration: 'none' }}
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
              </Link>
            ))}
        </ContainerCard>
      </Container>
      <Outlet />
    </>
  );
};
