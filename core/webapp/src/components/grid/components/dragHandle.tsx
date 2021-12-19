import { createWindowMouseEventListener } from 'lib/createWindowMouseEventListener';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const VertContainer = styled.div<{ active?: boolean }>`
  height: 100%;
  position: absolute;
  top: 0;
  right: -2px;
  min-width: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 2;
  cursor: w-resize;
  transition: background-color 0.3s;
  ${(props) =>
    props.active ? `background-color: ${props.theme.color.actionBg}` : null};
  :hover {
    background-color: ${(props) => props.theme.color.actionBg};
  }
`;

export const GridVertResizeDragHandle = ({
  onDragged,
}: {
  onDragged?: (deltaX: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!clicked) {
      return;
    }

    const removeMouseUp = createWindowMouseEventListener('mouseup', (event) => {
      setClicked(false);
    });
    const removeMouseMove = createWindowMouseEventListener(
      'mousemove',
      (event) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const deltaX = event.x - rect.x;
          if (onDragged) {
            onDragged(deltaX);
          }
        }
      }
    );

    return () => {
      removeMouseUp();
      removeMouseMove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clicked]);

  return (
    <VertContainer
      ref={ref}
      onMouseDown={(e) => {
        console.log('aoeu');
        setClicked(true);
        e.preventDefault();
      }}
    />
  );
};

const HorizContainer = styled.div<{ active?: boolean }>`
  position: absolute;
  width: 100%;
  min-height: 4px;
  bottom: -2px;
  z-index: ${(props) => props.theme.zIndex.dropdown};
  background-color: rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
  cursor: n-resize;
  ${(props) =>
    props.active ? `background-color: ${props.theme.color.actionBg}` : null};
  :hover {
    background-color: ${(props) => props.theme.color.actionBg};
  }
`;
export const GridHorizResizeDragHandle = ({
  onDragged,
}: {
  onDragged?: (deltaY: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!clicked) {
      return;
    }

    const removeMouseUp = createWindowMouseEventListener('mouseup', (event) => {
      setClicked(false);
    });
    const removeMouseMove = createWindowMouseEventListener(
      'mousemove',
      (event) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const deltaY = event.y - rect.y;
          if (onDragged) {
            onDragged(deltaY);
          }
        }
      }
    );

    return () => {
      removeMouseUp();
      removeMouseMove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clicked]);

  return (
    <HorizContainer
      ref={ref}
      onMouseDown={(e) => {
        setClicked(true);
        e.preventDefault();
      }}
    />
  );
};
