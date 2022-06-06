import { CSSProperties } from 'react';

import { useDrop } from 'react-dnd';
import styled from 'styled-components';

import { styles } from 'styles/css';

const GridCellHorizContainer = styled.div<{ isOver?: boolean }>`
  position: absolute;
  height: 100%;
  width: 40%;
  max-width: 80px;
  background-color: gray;
  opacity: ${(props) => (props.isOver ? '0.5' : '0.3')};
  ${styles.transition.default};
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

  onDrop?: (item: { key: string; rowIndex: number; cellIndex: number }) => void;
}) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      drop(item: { id: string; rowIndex: number; cellIndex: number }) {
        if (onDrop) {
          onDrop({
            key: item.id,
            rowIndex: item.rowIndex,
            cellIndex: item.cellIndex,
          });
        }
      },
      accept: dropAcceptType,
      collect(monitor) {
        return {
          isOver: monitor.isOver(),
        };
      },
    }),
    [onDrop, dropAcceptType]
  );

  return (
    <GridCellHorizContainer
      ref={drop}
      isOver={isOver}
      style={style}
    ></GridCellHorizContainer>
  );
};
