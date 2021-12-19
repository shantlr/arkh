import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { createTimeout } from 'lib/createTimeout';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

const Container = styled.div`
  display: inline-block;
`;

const PopperContainer = styled.div`
  background-color: white;
  max-height: 400px;
  overflow: auto;
  z-index: ${(props) => props.theme.zIndex.dropdown};
  box-shadow: ${(props) => props.theme.shadow.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
`;

const OptionContainer = styled.div`
  padding: ${(props) => `${props.theme.space.sm} ${props.theme.space.md}`};
  cursor: pointer;

  transition: 0.3s;
  :hover {
    background-color: ${(props) => props.theme.color.actionBg};
    color: ${(props) => props.theme.color.actionColor};
  }
`;

export interface IOption<T = any> {
  key: string | number;
  value: T;
  label: string | number | JSX.Element;
}

export function Dropdown<T>({
  className,
  children,
  options,
  onSelect,
}: {
  className?: string;
  children: JSX.Element;
  options?: IOption<T>[];
  onSelect?: (opt: IOption<T>) => void;
}) {
  const [showPopper, setShowPopper] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);

  const [lastMoveOut, setLastMoveOut] = useState<number | null>(null);

  useEffect(() => {
    if (!lastMoveOut) {
      return;
    }
    return createTimeout(() => {
      setShowPopper(false);
      setLastMoveOut(null);
    }, 300);
  }, [lastMoveOut]);

  const popper = usePopper(containerRef, popperRef, {
    placement: 'bottom-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 4],
        },
      },
    ],
  });

  return (
    <>
      <Container
        className={className}
        ref={setContainerRef}
        onMouseEnter={() => {
          setShowPopper(true);
          setLastMoveOut(null);
        }}
        onMouseLeave={() => {
          setLastMoveOut(Date.now());
        }}
      >
        {children}
        {showPopper &&
          Boolean(options) &&
          ReactDOM.createPortal(
            <PopperContainer
              style={popper.styles.popper}
              {...popper.attributes.popper}
              ref={setPopperRef}
            >
              {options?.map((opt) => (
                <OptionContainer
                  key={opt.key}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(opt);
                    }
                  }}
                >
                  {opt.label}
                </OptionContainer>
              ))}
            </PopperContainer>,
            document.body
          )}
      </Container>
    </>
  );
}
