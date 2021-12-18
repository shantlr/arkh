import { CSSProperties } from 'react';
import { useDrop } from 'react-dnd';
import styled from 'styled-components';

const GridCellHorizContainer = styled.div`
  position: absolute;
  height: 100%;
  width: 40%;
  max-width: 80px;
  background-color: gray;
  opacity: 0.5;
`;
export const GridCellHorizDroppable = ({
  style,
  dropAcceptType,
  onDrop,
}: {
  style: CSSProperties;
  dropAcceptType: string;
  cellIndex: number;
  rowIndex: number;

  onDrop?: (item: { rowIndex: number; cellIndex: number }) => void;
}) => {
  const [, drop] = useDrop(
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
