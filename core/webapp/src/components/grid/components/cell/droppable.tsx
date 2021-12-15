import { CSSProperties } from 'react';
import { useDrop } from 'react-dnd';
import styled from 'styled-components';

const GridCellHorizContainer = styled.div`
  position: absolute;
  height: 33%;
  width: 40%;
  background-color: gray;
`;
export const GridCellHorizDroppable = ({
  style,
  dropAcceptType,
  rowIndex,
  cellIndex,
  onDrop,
}: {
  style: CSSProperties;
  dropAcceptType: string;
  cellIndex: number;
  rowIndex: number;

  onDrop?: (item: { rowIndex: number; cellIndex: number }) => void;
}) => {
  const [p, drop] = useDrop(
    () => ({
      drop(item: { rowIndex: number; cellIndex: number }) {
        if (onDrop) {
          onDrop(item);
        }
      },
      accept: dropAcceptType,
    }),
    [onDrop, dropAcceptType]
  );

  return (
    <GridCellHorizContainer ref={drop} style={style}></GridCellHorizContainer>
  );
};
