import { Text } from 'components/text';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useReducer } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import styled from 'styled-components';
import { styles } from 'styles/css';
import { formatJsonLog } from './formatJsonLog';
import { logDefaultState, LogPage, logReducer } from './reducer';

const Timestamp = styled.span`
  color: ${(props) => props.theme.logs.timestampColor};
  user-select: none;
`;
const TimeDelta = styled.span`
  color: ${(props) => props.theme.logs.timeDeltaColor};
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
        <Text as="div" size="xs" key={idx}>
          <Timestamp>{showTimestamp ? d : ''}</Timestamp>
          {l}
        </Text>
      ))}
    </>
  );
};

const Page = React.memo(
  ({
    showTimeDelta,
    showTimestamp,
    formatJson = false,
    page,
  }: {
    showTimestamp?: boolean;
    showTimeDelta?: boolean;
    formatJson?: boolean;
    page: LogPage;
  }) => {
    const lines = useMemo(() => {
      if (formatJson) {
        return page.lines.map((line) => {
          try {
            const parsed = JSON.parse(line.text);
            return {
              ...line,
              text: formatJsonLog(parsed),
            };
          } catch {
            return line;
          }
        });
      }
      return page.lines;
    }, [formatJson, page.lines]);

    return (
      <>
        {lines.map((line, idx) => (
          <Text as="div" size="xs" key={idx}>
            {showTimestamp && <Timestamp>{line.date} </Timestamp>}
            {line.text}
            {showTimeDelta && <TimeDelta> {line.delta}</TimeDelta>}
          </Text>
        ))}
      </>
    );
  }
);

export const LogContainer = styled.div<{ shouldRoundTopRight?: boolean }>`
  height: 100%;
  overflow: auto;
  white-space: pre-wrap;
  color: ${(props) => props.theme.logs.color};
  background-color: ${(props) => props.theme.logs.bg};
  ${styles.text.sm};
  ${styles.padding.md};
  ${styles.roundedBottomLeft.md};
  ${styles.roundedBottomRight.md};
  ${(props) => (props.shouldRoundTopRight ? styles.roundedTopRight.md : null)};
`;

const NoLogs = styled.div`
  color: ${(props) => props.theme.logs.noLogColor};
`;

export const Logs = React.memo(
  ({
    logBatches,
    showTimestamp = false,
    showTimeDelta = false,
    formatJson = false,
    shouldRoundTopRight = false,
  }: {
    logBatches: {
      text: string;
      date: number | Date;
    }[];
    showTimestamp?: boolean;
    showTimeDelta?: boolean;
    formatJson?: boolean;
    shouldRoundTopRight?: boolean;
  }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const refShouldAutoScoll = useRef(false);

    const [state, dispatch] = useReducer(logReducer, logDefaultState);

    useEffect(() => {
      dispatch({
        type: 'sync',
        logBatches,
      });
    }, [logBatches]);

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
        shouldRoundTopRight={shouldRoundTopRight}
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
        {state && !state.pages.length && <NoLogs>-- no logs --</NoLogs>}
        {state.pages.map((page, idx) => (
          <Page
            key={idx}
            page={page}
            showTimestamp={showTimestamp}
            showTimeDelta={showTimeDelta}
            formatJson={formatJson}
          />
        ))}
      </LogContainer>
    );
  }
);
