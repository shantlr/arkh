import { CSSProperties } from 'react';
import { useDrop } from 'react-dnd';
import styled from 'styled-components';
import { styles } from 'styles/css';

const GridCellVertContainer = styled.div<{ isOver?: boolean }>`
  position: absolute;
  height: 33%;
  width: 100%;
  max-height: 80px;
  background-color: gray;
  opacity: ${(props) => (props.isOver ? '0.5' : '0.3')};
  ${styles.transition.default};
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
  const [{ isOver }, drop] = useDrop(
    () => ({
      drop(item: { rowIndex: number; cellIndex: number }) {
        if (onDrop) {
          onDrop(item);
        }
      },
      accept: dropAcceptType,
      collect(monitor) {
        return {
          isOver: monitor.isOver({ shallow: true }),
        };
      },
    }),
    [onDrop, dropAcceptType]
  );

  return (
    <GridCellVertContainer
      ref={drop}
      isOver={isOver}
      style={style}
    ></GridCellVertContainer>
  );
};
