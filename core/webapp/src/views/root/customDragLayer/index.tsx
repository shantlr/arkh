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
  const { isDragging, item, itemType, off } = useDragLayer((monitor) => {
    const item = monitor.getItem();
    return {
      isDragging: monitor.isDragging(),
      item,
      off: monitor.getClientOffset(),
      itemType: monitor.getItemType() as string,
    };
  });

  if (!isDragging || !item || !off) {
    return null;
  }
  if (item.id === 'grid-cell') {
    return (
      <Container>
        <div
          style={{
            transform: `translate(${off.x - 85}px, ${off.y - 12}px)`,
            opacity: 0.7,
          }}
        >
          <ServiceLogs
            style={{
              maxWidth: 150,
              maxHeight: 200,
            }}
            dragType={itemType}
            fullName={item.id}
            defaultTaskId={item.taskId}
            rowIndex={item.rowIndex}
            cellIndex={item.cellIndex}
          />
        </div>
      </Container>
    );
  }
  return null;
};
