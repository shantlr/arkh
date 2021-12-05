import { useQuery } from 'react-query';
import { Outlet, useParams } from 'react-router';
import styled from 'styled-components';
import { API } from 'configs';
import { Text } from 'components/text';
import { map } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Button } from 'components/button';
import { BaseCard } from 'components/card';

const Container = styled.div`
  background-color: white;
  padding-top: ${(props) => props.theme.space.lg};
  box-sizing: border-box;
  min-width: 200px;
  height: 100%;
`;

export const StackDetails = () => {
  const { name } = useParams();
  const { data, isLoading } = useQuery(
    ['stack', name],
    () => API.stack.get(name as string),
    {
      enabled: Boolean(name),
    }
  );
  console.log('stack', name, data);

  return (
    <>
      <BaseCard>
        <Container>
          <div>
            <Link to="/stack">
              <Button>
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </Link>
            {Boolean(data) && (
              <Text style={{ marginLeft: 5 }}>{data.name}</Text>
            )}
          </div>
          {Boolean(data) && (
            <div>
              <Text style={{ marginTop: 5 }} as="div">
                Services:
              </Text>
              {map(data.spec.services, (service, name) => (
                <Link to={`service/${name}`} key={name}>
                  <Text as="div">{name}</Text>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </BaseCard>
      <Outlet />
    </>
  );
};
