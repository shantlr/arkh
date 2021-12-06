import { useMutation, useQuery } from 'react-query';
import { Outlet, useParams } from 'react-router';
import styled from 'styled-components';
import { API } from 'configs';
import { Text } from 'components/text';
import { map } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'components/button';
import { BaseCard } from 'components/card';
import { NoStyleLink } from 'components/noStyleLink';

const Container = styled.div`
  background-color: white;
  padding-top: ${(props) => props.theme.space.lg};
  box-sizing: border-box;
  min-width: 200px;
  height: 100%;
`;

const ServiceList = styled.div`
  display: flex;
  flex-wrap: wrap;
`;
const ServiceItem = styled.div`
  margin-right: ${(props) => props.theme.space.md};
  background-color: ${(props) => props.theme.color.mainBg};
  padding: ${(props) => props.theme.space.sm};
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.3s;
  min-width: 65px;
  :hover {
    background-color: ${(props) => props.theme.color.mainHighlightBg};
    box-shadow: ${(props) => props.theme.shadow.md};
  }
`;

export const StackDetails = () => {
  const { name, serviceKey: routeServiceKey } = useParams();
  const { data, isLoading } = useQuery(
    ['stack', name],
    () => API.stack.get(name as string),
    {
      enabled: Boolean(name),
    }
  );
  const { mutate: runService } = useMutation(
    ({ serviceName }: { serviceName: string }) =>
      API.service.run({ name: serviceName })
  );

  return (
    <>
      <BaseCard>
        <Container>
          <div>
            <NoStyleLink to="/stack">
              <Button>
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </NoStyleLink>
            {Boolean(data) && (
              <Text style={{ marginLeft: 5 }}>{data.name}</Text>
            )}
          </div>
          {Boolean(data) && (
            <div>
              <Text style={{ marginTop: 5 }} as="div">
                Services:
              </Text>
              <ServiceList>
                {map(data.spec.services, (service, serviceKey) => (
                  <NoStyleLink
                    to={`service/${serviceKey}`}
                    key={serviceKey}
                    onClick={(e) => {
                      if (serviceKey === routeServiceKey) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <ServiceItem
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ marginRight: 5 }}>{serviceKey}</Text>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          runService({
                            serviceName: `${name}.${serviceKey}`,
                          });
                        }}
                      >
                        <FontAwesomeIcon icon={faPlay} />
                      </Button>
                    </ServiceItem>
                  </NoStyleLink>
                ))}
              </ServiceList>
            </div>
          )}
        </Container>
      </BaseCard>
      <Outlet />
    </>
  );
};
