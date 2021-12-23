import { chunk, last } from 'lodash';
import dayjs from 'dayjs';

const PAGE_SIZE = 50;

export type Line = {
  timestamp: number;
  date: string;
  text: string;
  delta?: string;
};
export type LogPage = {
  lines: Line[];
};
type LogState = {
  pages: LogPage[];
  securedOffset: number;
};

export const logDefaultState: LogState = {
  pages: [],
  securedOffset: 0,
};

const formatDuration = (duration: number | null) => {
  if (duration === null) {
    return '';
  }
  if (duration < 1000) {
    return `+ ${duration}ms`;
  }
  if (duration < 60 * 1000) {
    return `+ ${Math.floor(duration / 1000)}s`;
  }
  if (duration < 60 * 60 * 1000) {
    return `+ ${Math.floor(duration / (60 * 60 * 1000))}min`;
  }
};

type LogBatch = { text: string; date: number | Date };
type Action = {
  type: 'sync';
  logBatches: LogBatch[];
};

const computeLines = (
  lastLine: Line | null | undefined,
  logBatches: LogBatch[]
) => {
  let lastTimestamp = lastLine ? lastLine.timestamp : null;
  const lines: Line[] = [];

  logBatches.forEach((logBatch) => {
    const text = logBatch.text.endsWith('\n')
      ? logBatch.text.slice(0, logBatch.text.length - 1)
      : logBatch.text;
    const timestamp = new Date(logBatch.date).valueOf();
    const delta = lastTimestamp ? timestamp - lastTimestamp : null;
    lines.push(
      ...text.split('\n').map((t, idx) => ({
        timestamp,
        text: t,
        date: dayjs(logBatch.date).format('DD-MM-YYYY HH:mm'),
        delta: formatDuration(
          typeof delta === 'number' ? delta : idx > 0 ? 0 : null
        ),
      }))
    );
    lastTimestamp = timestamp;
  });

  return lines;
};

export const logReducer = (state: LogState, action: Action): LogState => {
  switch (action.type) {
    case 'sync': {
      const toAdd = action.logBatches.slice(state.securedOffset);
      if (toAdd.length) {
        const currentLastPage = last(state.pages);
        const lastLine = currentLastPage ? last(currentLastPage.lines) : null;
        const lines = computeLines(lastLine, toAdd);

        const nextPages = [...state.pages];
        if (currentLastPage && currentLastPage.lines.length < PAGE_SIZE) {
          // lines left in last page
          const leftSize = PAGE_SIZE - currentLastPage.lines.length;
          // fill last page
          nextPages[nextPages.length - 1] = {
            lines: [...currentLastPage.lines, ...lines.slice(0, leftSize)],
          };
          nextPages.push(
            ...chunk(lines.slice(leftSize)).map((lineChunk) => ({
              lines: lineChunk,
            }))
          );
        } else {
          nextPages.push(
            ...chunk(lines, PAGE_SIZE).map((lineChunk) => ({
              lines: lineChunk,
            }))
          );
        }
        return {
          ...state,
          pages: nextPages,
          securedOffset: action.logBatches.length,
        };
      }
      return state;
    }
    default:
  }
  return state;
};
