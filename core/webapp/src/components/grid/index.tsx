import React, { CSSProperties, Dispatch, useEffect, useReducer } from 'react';
import styled from 'styled-components';
import AutoSizer from 'react-virtualized-auto-sizer';

import { useEqualMemo } from 'lib/hooks';
import { Action, defaultState, reducer, State } from './reducer';
import {
  GridHorizResizeDragHandle,
  GridVertResizeDragHandle,
} from './components/dragHandle';
import { GridCell } from './components/cell';
import { GridRow, GridRowContent } from './components/row';
import { useMemo } from 'react';
import { StackTab } from '@shantlr/shipyard-common-types';
import { useState } from 'react';
import { GridEmptyDroppable } from './components/emptyDroppable';

const Container = styled.div`
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
`;

type GridProps = {
  children?: JSX.Element | boolean | (JSX.Element | boolean)[];
  dropAcceptType: string;
  className?: string;
  style?: CSSProperties;

  grid: {
    state: State;
    dispatch: Dispatch<Action>;
  };
};

export const useGridState = (tab: StackTab) => {
  const [initialState] = useState(() => {
    if (!tab.rows) {
      return { ...defaultState };
    }
    return {
      ...defaultState,
      keys: tab.keys,
      rows: tab.rows,
    };
  });
  const [state, dispatch] = useReducer(reducer, initialState);

  return useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state]
  );
};

const GridContainer = ({
  width,
  height,
  children,
  className,
  style,
  dropAcceptType,
  grid,
}: {
  height: number;
  width: number;
} & GridProps) => {
  const { state, dispatch } = grid;

  let childKeys: Record<string, true> = {};
  const childrenByKey: Record<string, JSX.Element> = {};

  if (Array.isArray(children)) {
    children.forEach((child) => {
      if (typeof child === 'object' && child.key) {
        childKeys[child.key] = true;
        childrenByKey[child.key] = child;
      }
    });
  } else if (typeof children === 'object' && children.key) {
    childKeys[children.key] = true;
    childrenByKey[children.key] = children;
  }

  const memoChildKeys = useEqualMemo(childKeys);

  useEffect(() => {
    dispatch({ type: 'sync-keys', childKeys: memoChildKeys });
  }, [memoChildKeys, dispatch]);

  useEffect(() => {
    dispatch({ type: 'resize-height', height });
  }, [height, dispatch]);
  useEffect(() => {
    dispatch({ type: 'resize-width', width });
  }, [width, dispatch]);

  return (
    <Container
      className={className}
      style={{
        ...(style || null),
        height,
        width,
      }}
    >
      {!state.rows.length && (
        <GridEmptyDroppable
          dropAcceptType={dropAcceptType}
          onDrop={(item) => {
            dispatch({
              type: 'move-cell-to-new-row',
              key: item.id,
              dstRowIndex: 0,
            });
          }}
        />
      )}
      {state.rows.map((row, idx) => (
        <GridRow
          key={idx}
          rowIndex={idx}
          style={{
            height: height * row.height,
          }}
          dropAcceptType={dropAcceptType}
          isCellAlone={row.cells.length === 1}
          onMove={(data) => {
            dispatch({
              type: 'move-cell-to-new-row',
              ...data,
            });
          }}
        >
          <GridRowContent key="row-content">
            {row.cells.map((cell, cellIdx) => {
              const c = childrenByKey[cell.key];
              if (!c) {
                // This may happen when a child is removed
                // as sync will happen in next frame
                return null;
              }

              return (
                <GridCell
                  key={cell.key}
                  dropAcceptType={dropAcceptType}
                  rowIndex={idx}
                  cellIndex={cellIdx}
                  style={{ width: width * cell.width }}
                  onMove={(data) => {
                    dispatch({
                      type: 'move-cell',
                      ...data,
                    });
                  }}
                >
                  {cellIdx < row.cells.length - 1 ? (
                    <GridVertResizeDragHandle
                      onDragged={(delta) => {
                        dispatch({
                          type: 'resize-cell-width',
                          cellIndex: cellIdx,
                          rowIndex: idx,
                          delta,
                        });
                      }}
                    />
                  ) : null}
                  {typeof c.type === 'string'
                    ? c
                    : React.cloneElement(c, {
                        key: cell.key,
                        rowIndex: idx,
                        cellIndex: cellIdx,
                        isAloneInRow: row.cells.length === 1,
                      })}
                </GridCell>
              );
            })}
          </GridRowContent>
          {idx < state.rows.length - 1 ? (
            <GridHorizResizeDragHandle
              key="row-resize-handle"
              onDragged={(delta) => {
                dispatch({
                  type: 'resize-row-height',
                  rowIndex: idx,
                  delta,
                });
              }}
            />
          ) : null}
        </GridRow>
      ))}
    </Container>
  );
};

export const Grid = (props: GridProps) => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <GridContainer height={height} width={width} {...props} />
        )}
      </AutoSizer>
    </div>
  );
};
