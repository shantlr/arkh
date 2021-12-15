import { BaseCard } from 'components/card';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import styled from 'styled-components';

const Timestamp = styled.span`
  color: #8d8e8d;
  font-size: 11px;
`;

export const TextBatch = ({
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
const Container = styled(BaseCard)`
  background-color: black;
  padding: ${(props) => props.theme.space.md};
  height: 100%;
  color: white;
  overflow: auto;
  font-size: ${(props) => props.theme.fontSize.sm};
`;

export const Logs = ({
  logBatches,
  showTimestamp,
}: {
  logBatches: {
    text: string;
    date: number | Date;
  }[];
  showTimestamp: boolean;
}) => {
  return (
    <Container>
      {logBatches.map((batch, idx) => (
        <TextBatch
          key={idx}
          text={batch.text}
          date={batch.date}
          showTimestamp={showTimestamp}
        />
      ))}
    </Container>
  );
};
