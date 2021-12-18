import { CSSProperties } from 'react';
import { useDrop } from 'react-dnd';
import styled from 'styled-components';
import { GridCellHorizDroppable } from './droppable';

const GridCellContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
`;
export const GridCell = ({
  children,
  style,
  cellIndex,
  rowIndex,

  onMove,

  dropAcceptType,
}: {
  dropAcceptType: string;
  style: CSSProperties;
  children: JSX.Element | (JSX.Element | null | boolean)[];
  cellIndex: number;
  rowIndex: number;
  onMove: (data: {
    srcRowIndex: number;
    srcCellIndex: number;
    dstRowIndex: number;
    dstCellIndex: number;
  }) => void;
}) => {
  const [{ hasLeft, hasRight }, drop] = useDrop(
    () => ({
      accept: dropAcceptType,
      collect(monitor) {
        if (!monitor.isOver()) {
          return {
            hasRight: false,
            hasLeft: false,
          };
        }

        const item = monitor.getItem<{ rowIndex: number; cellIndex: number }>();
        if (!item) {
          return {
            hasRight: false,
            hasLeft: false,
          };
        }
        const isNotSameRow = item.rowIndex !== rowIndex;
        const isNotSameCell = isNotSameRow || item.cellIndex !== cellIndex;

        return {
          hasLeft:
            isNotSameCell && (isNotSameRow || item.cellIndex !== cellIndex - 1),
          hasRight:
            isNotSameCell && (isNotSameRow || item.cellIndex !== cellIndex + 1),
        };
      },
    }),
    [rowIndex, cellIndex]
  );

  return (
    <GridCellContainer ref={drop} style={style}>
      {children}
      {hasLeft && (
        <GridCellHorizDroppable
          cellIndex={cellIndex}
          rowIndex={rowIndex}
          dropAcceptType={dropAcceptType}
          style={{
            top: 0,
            left: 0,
          }}
          onDrop={(item) => {
            onMove({
              srcCellIndex: item.cellIndex,
              srcRowIndex: item.rowIndex,
              dstRowIndex: rowIndex,
              dstCellIndex: cellIndex,
            });
          }}
        />
      )}
      {hasRight && (
        <GridCellHorizDroppable
          cellIndex={cellIndex}
          rowIndex={rowIndex}
          dropAcceptType={dropAcceptType}
          style={{
            top: 0,
            right: 0,
          }}
          onDrop={(item) => {
            onMove({
              srcCellIndex: item.cellIndex,
              srcRowIndex: item.rowIndex,
              dstRowIndex: rowIndex,
              dstCellIndex: cellIndex + 1,
            });
          }}
        />
      )}
    </GridCellContainer>
  );
};
