import { useDrop } from 'react-dnd';
import styled from 'styled-components';

const Container = styled.div<{ isOver: boolean }>`
  height: 100%;
  width: 100%;
  ${(props) => (props.isOver ? `background-color: gray` : null)};
`;

export const GridEmptyDroppable = ({
  dropAcceptType,
  onDrop,
}: {
  dropAcceptType: string;
  onDrop: (item: { id: string }) => void;
}) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      drop(item: { id: string }) {
        if (onDrop) {
          onDrop(item);
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
  return <Container ref={drop} isOver={isOver}></Container>;
};
