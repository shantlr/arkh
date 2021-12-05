import { BaseCard } from 'components/card';
import { Text } from 'components/text';
import { API } from 'configs';
import { useQuery } from 'react-query';
import { useParams } from 'react-router';
import styled from 'styled-components';
import dayjs from 'dayjs';
import relative from 'dayjs/plugin/relativeTime';
import { ServiceTask } from 'configs/types';
import { DateFromNow } from 'components/dateFromNow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/button';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const Container = styled.div`
  min-width: 400px;
  height: 100%;
  padding: ${(props) => props.theme.space.lg};
  box-sizing: border-box;
`;

const Card = styled(BaseCard)`
  height: 100%;
`;

dayjs.extend(relative);

const getTaskState = (task: ServiceTask) => {
  if (task.exited_at) {
    return 'exited';
  }
  if (task.stopped_at) {
    return 'stopped';
  }
  if (task.stopping_at) {
    return 'stopping';
  }
  if (task.running_at) {
    return 'running';
  }
  if (task.creating_at) {
    return 'creating';
  }
  return 'unknown';
};

export const ServiceDetails = () => {
  const { name: stackName, serviceName: serviceKey } = useParams();

  const serviceName = `${stackName}.${serviceKey}`;
  const { data } = useQuery(['service', serviceName], () =>
    API.service.get(serviceName)
  );

  const { data: tasks } = useQuery(['service', serviceName, 'tasks'], () =>
    API.service.task.list(serviceName)
  );

  console.log('service', serviceName, data, tasks);
  return (
    <Container>
      <Card t="main">
        <div>
          <Link to={`/stack/${stackName}`}>
            <Button>
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </Link>
          <Text style={{ marginLeft: 5 }}>{serviceName}</Text>
        </div>
        {tasks && (
          <div>
            {tasks.map((task) => (
              <div key={task.id}>
                <DateFromNow date={task.creating_at} /> - {getTaskState(task)}{' '}
                {typeof task.exit_code === 'number'
                  ? `(${task.exit_code})`
                  : ''}
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
};
