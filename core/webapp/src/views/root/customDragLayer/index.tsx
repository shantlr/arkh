import { useDragLayer } from 'react-dnd';
import styled from 'styled-components';
import { ServiceLogs } from 'views/stackDetails/serviceLog';

const Container = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 100;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
`;

export const CustomDragLayer = () => {
  const { isDragging, item, currentOffset, itemType } = useDragLayer(
    (monitor) => {
      const item = monitor.getItem();
      return {
        isDragging: monitor.isDragging(),
        item,
        currentOffset: monitor.getSourceClientOffset(),
        itemType: monitor.getItemType() as string,
      };
    }
  );

  if (!isDragging || !item || !currentOffset) {
    return null;
  }

  return (
    <Container>
      <div
        style={{
          transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
          opacity: 0.7,
        }}
      >
        <ServiceLogs
          style={{
            maxWidth: 150,
            maxHeight: 30,
          }}
          dragType={itemType}
          fullName={item.id}
          rowIndex={item.rowIndex}
          cellIndex={item.cellIndex}
        />
      </div>
    </Container>
  );
};
