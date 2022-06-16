import { CSSProperties } from 'react';

import { useDrop } from 'react-dnd';
import styled from 'styled-components';

import { GridRowVertDroppable } from './droppable';

export const GridRowContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  position: relative;
`;

export const GridRowContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: nowrap;
`;
export const GridRow = ({
  style,
  children,
  isCellAlone,
  rowIndex,
  dropAcceptType,
  onMove,
}: {
  style: CSSProperties;
  isCellAlone: boolean;
  children?: JSX.Element | (JSX.Element | null | boolean)[];
  rowIndex: number;
  dropAcceptType: string;
  onMove: (data: {
    key: string;
    srcRowIndex?: number;
    srcCellIndex?: number;
    dstRowIndex: number;
  }) => void;
}) => {
  const [{ hasTop, hasBottom }, drop] = useDrop(
    () => ({
      accept: dropAcceptType,
      collect(monitor) {
        if (!monitor.isOver()) {
          return {
            hasTop: false,
            hasBottom: false,
          };
        }
        const item =
          monitor.getItem<{ rowIndex: number; isAloneInRow: boolean }>();
        if (!item || (isCellAlone && item.rowIndex === rowIndex)) {
          return {
            hasTop: false,
            hasBottom: false,
          };
        }

        return {
          hasTop: !(item.rowIndex === rowIndex - 1 && item.isAloneInRow),
          hasBottom: !(item.rowIndex === rowIndex + 1 && item.isAloneInRow),
        };
      },
    }),
    [rowIndex, isCellAlone]
  );

  return (
    <GridRowContainer ref={drop} style={style}>
      {children}
      {hasTop && (
        <GridRowVertDroppable
          key="droppable-top"
          style={{
            top: 0,
            left: 0,
          }}
          dropAcceptType={dropAcceptType}
          rowIndex={rowIndex}
          onDrop={(item) => {
            onMove({
              key: item.id,
              srcCellIndex: item.cellIndex,
              srcRowIndex: item.rowIndex,
              dstRowIndex: rowIndex,
            });
          }}
        />
      )}
      {hasBottom && (
        <GridRowVertDroppable
          key="droppable-bottom"
          style={{
            bottom: 0,
            left: 0,
          }}
          dropAcceptType={dropAcceptType}
          rowIndex={rowIndex}
          onDrop={(item) => {
            onMove({
              key: item.id,
              srcCellIndex: item.cellIndex,
              srcRowIndex: item.rowIndex,
              dstRowIndex: rowIndex + 1,
            });
          }}
        />
      )}
    </GridRowContainer>
  );
};
