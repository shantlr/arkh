import { useQuery, useQueryClient } from 'react-query';
import { Outlet, useParams } from 'react-router';
import styled from 'styled-components';
import { API } from 'configs';
import { Text } from 'components/text';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'components/button';
import { BaseCard } from 'components/card';
import { NoStyleLink } from 'components/noStyleLink';
import { createUseSubscribe, useSocketListen } from 'lib/context/socket';
import { useCallback } from 'react';
import { Grid } from 'components/grid';
import { map } from 'lodash';
import { ServiceLogs } from './serviceLog';

const Container = styled.div`
  background-color: white;
  padding-top: ${(props) => props.theme.space.lg};
  box-sizing: border-box;
  min-width: 500px;
  height: 100%;

  display: flex;
  flex-direction: column;
`;

const useSubscribeStack = createUseSubscribe({
  key: 'subscribe-stacks',
  subscribe(socket) {
    socket.emit('subscribe-stacks');
  },
  unsubscribe(socket) {
    socket.emit('unsubscribe-stacks');
  },
});

// const ExampleItem = ({
//   children,
//   rowIndex,
//   cellIndex,
//   isAloneInRow,
// }: {
//   children: string;
//   rowIndex?: number;
//   cellIndex?: number;
//   isAloneInRow?: boolean;
// }) => {
//   const [p, drag, preview] = useDrag(
//     () => ({
//       type: 'cell',
//       item: {
//         rowIndex,
//         cellIndex,
//         isAloneInRow,
//       },
//     }),
//     [rowIndex, cellIndex, isAloneInRow]
//   );
//   return (
//     <div
//       ref={preview}
//       key="s-1"
//       style={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         height: '100%',
//       }}
//     >
//       <div style={{ cursor: 'grab' }} ref={drag}>
//         :::
//       </div>
//       {children}
//     </div>
//   );
// };

export const StackDetails = () => {
  const { name, serviceKey: routeServiceKey } = useParams();
  const { data } = useQuery(
    ['stack', name],
    () => API.stack.get(name as string),
    {
      enabled: Boolean(name),
    }
  );
  // const { mutate: runService } = useMutation(
  //   ({ serviceName }: { serviceName: string }) =>
  //     API.service.run({ name: serviceName })
  // );

  const queryClient = useQueryClient();

  useSubscribeStack();
  useSocketListen(
    'stack-event',
    useCallback(
      (event) => {
        queryClient.invalidateQueries('stacks');
        queryClient.invalidateQueries('stack');
      },
      [queryClient]
    )
  );

  return (
    <>
      <BaseCard style={{ width: '100%', flexGrow: 3, paddingLeft: 0 }}>
        <Container>
          <div style={{ marginBottom: 5 }}>
            <NoStyleLink to="/stack">
              <Button>
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </NoStyleLink>
            {Boolean(data) && (
              <Text style={{ marginLeft: 5 }}>{data.name}</Text>
            )}
          </div>
          <Grid dropAcceptType="cell">
            {Boolean(data) &&
              map(data.spec.services, (service, key) => (
                <ServiceLogs
                  key={`${name}.${key}`}
                  fullName={`${name}.${key}`}
                  dragType="cell"
                />
              ))}
          </Grid>
        </Container>
      </BaseCard>
      <Outlet />
    </>
  );
};
