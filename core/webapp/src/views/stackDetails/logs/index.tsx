import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import styled from 'styled-components';

const Timestamp = styled.span`
  color: ${(props) => props.theme.logs.timestampColor};
  font-size: 11px;
  user-select: none;
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
    let t = text;
    // remove trailing line break
    if (t.endsWith('\n')) {
      t = t.slice(0, t.length - 1);
    }
    return t.split('\n');
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
export const LogContainer = styled.div`
  background-color: ${(props) => props.theme.logs.bg};
  padding: ${(props) => props.theme.space.md};
  height: 100%;
  color: ${(props) => props.theme.logs.color};
  overflow: auto;
  font-size: ${(props) => props.theme.fontSize.sm};
  border-bottom-left-radius: ${(props) => props.theme.space.md};
  border-bottom-right-radius: ${(props) => props.theme.space.md};
  border-top-right-radius: ${(props) => props.theme.space.md};
  white-space: pre-wrap;
`;

const NoLogs = styled.div`
  color: ${(props) => props.theme.logs.noLogColor};
`;

export const Logs = React.memo(
  ({
    logBatches,
    showTimestamp,
  }: {
    logBatches: {
      text: string;
      date: number | Date;
    }[];
    showTimestamp: boolean;
  }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const refShouldAutoScoll = useRef(false);

    useEffect(() => {
      const observer = new MutationObserver((mutationList, observer) => {
        if (ref.current) {
          if (refShouldAutoScoll.current) {
            // auto scroll to bottom
            ref.current.scrollTop = ref.current.scrollHeight;
          }
        }
      });
      if (ref.current) {
        observer.observe(ref.current, {
          childList: true,
        });
      }

      return () => {
        observer.disconnect();
      };
    }, []);

    return (
      <LogContainer
        ref={ref}
        onScroll={(e) => {
          if (ref.current) {
            // track if we should auto scroll in case of new logs
            if (
              ref.current.scrollTop + ref.current.clientHeight >=
              ref.current.scrollHeight
            ) {
              refShouldAutoScoll.current = true;
            } else {
              refShouldAutoScoll.current = false;
            }
          }
        }}
      >
        {logBatches && !logBatches.length && <NoLogs>-- no logs --</NoLogs>}
        {logBatches.map((batch, idx) => (
          <TextBatch
            key={idx}
            text={batch.text}
            date={batch.date}
            showTimestamp={showTimestamp}
          />
        ))}
      </LogContainer>
    );
  }
);
