import { CSSProperties } from 'react';
import { useDrop } from 'react-dnd';
import styled from 'styled-components';

const GridCellVertContainer = styled.div`
  position: absolute;
  height: 33%;
  width: 100%;
  background-color: gray;
`;
export const GridRowVertDroppable = ({
  style,
  dropAcceptType,
  rowIndex,
  onDrop,
}: {
  style: CSSProperties;
  dropAcceptType: string;
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
    <GridCellVertContainer ref={drop} style={style}></GridCellVertContainer>
  );
};
