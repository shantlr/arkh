import { API } from 'configs';
import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import styled, { css } from 'styled-components';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { BaseCard } from 'components/card';

const Container = styled.div`
  padding: ${(props) => props.theme.space.lg};
  padding-top: 0px;
  box-sizing: border-box;
  height: 100%;
  max-height: 50%;
  display: flex;
  flex-direction: column;
`;

const Card = styled(BaseCard)`
  background-color: black;
  padding: ${(props) => props.theme.space.md};
  height: 100%;
  color: white;
  overflow: auto;
  font-size: ${(props) => props.theme.fontSize.sm};
`;

const Timestamp = styled.span`
  /* color: #3dd684; */
  color: #8d8e8d;
  font-size: 11px;
`;

const TextBatch = ({
  showTimestamp,
  date,
  text,
}: {
  showTimestamp: boolean;
  date: number | Date;
  text: string;
}) => {
  const lines = useMemo(() => {
    return text.split('\n');
  }, [text]);

  const d = dayjs(date).format('DD-MM-YYYY HH:mm ');
  return (
    <>
      {lines.map((l, idx) => (
        <div key={idx}>
          <Timestamp>{showTimestamp ? d : ''}</Timestamp>
          {l}
        </div>
      ))}
    </>
  );
};

const OptionList = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.space.sm};
  margin-left: 8px;
`;

const optionActive = css`
  opacity: 1;
`;
const Option = styled.div<{ active?: boolean }>`
  margin-right: ${(props) => props.theme.space.md};
  background-color: black;
  color: white;
  padding: 0px 2px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;

  opacity: 0.7;
  ${(props) => (props.active ? optionActive : null)};
  :hover {
    ${optionActive};
  }
`;

export const TaskLogs = ({ taskId }: { taskId: string }) => {
  const { data } = useQuery(['task', taskId, 'logs'], () =>
    API.service.task.logs(taskId)
  );
  const [showTimestamp, setShowTimetstamp] = useState(true);

  return (
    <Container>
      <OptionList>
        <Option
          active={showTimestamp}
          onClick={() => {
            setShowTimetstamp(!showTimestamp);
          }}
        >
          <FontAwesomeIcon icon={faClock} />
        </Option>
      </OptionList>
      <Card>
        {data &&
          data.map((batch) => (
            <TextBatch
              key={batch.date}
              showTimestamp={showTimestamp}
              date={batch.date}
              text={batch.text}
            />
          ))}
      </Card>
    </Container>
  );
};
