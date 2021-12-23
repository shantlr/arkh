import { useEffect, useState, CSSProperties } from 'react';
import ReactDOM from 'react-dom';
import { usePopper } from 'react-popper';
import styled, { css } from 'styled-components';
import { Placement } from '@popperjs/core';
import { motion, HTMLMotionProps } from 'framer-motion';

import { createTimeout } from 'lib/createTimeout';

const Container = styled.div`
  display: inline-block;
`;

const PopperContainer = styled(motion.ul)`
  background-color: white;
  max-height: 400px;
  z-index: ${(props) => props.theme.zIndex.dropdown};
  box-shadow: ${(props) => props.theme.shadow.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  list-style: none;
  padding: 0;

  @media screen and (max-height: 950px) {
    max-height: 350px;
  }
  @media screen and (max-height: 850px) {
    max-height: 300px;
  }
  @media screen and (max-height: 750px) {
    max-height: 270px;
  }
  @media screen and (max-height: 550px) {
    max-height: 230px;
  }
`;

const activeCss = css`
  background-color: ${(props) => props.theme.color.actionBg};
  color: ${(props) => props.theme.color.actionColor};
`;
const OptionContainer = styled(({ active, ...props }) => (
  <motion.li {...props} />
))<{ active?: boolean } & HTMLMotionProps<'div'>>`
  padding: ${(props) => `${props.theme.space.sm} ${props.theme.space.md}`};
  cursor: pointer;

  ${(props) => (props.active ? activeCss : null)};
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

const variants = {
  hidden: { maxHeight: 10, overflow: 'hidden' },
  visible: {
    maxHeight: 300,
    overflow: 'auto',
  },
};

export function Dropdown<T extends IOption>({
  className,
  style,
  placement,
  children,
  selected,
  options,
  onSelect,
  closeDelay = 150,
}: {
  className?: string;
  style?: CSSProperties;
  children: JSX.Element;
  selected?: string | number | undefined | null;
  placement?: Placement;
  options?: T[];
  onSelect?: (opt: T) => void;
  closeDelay?: number;
}) {
  const [showPopper, setShowPopper] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);

  const [lastMouseLeave, setLastMouseLeave] = useState<number | null>(null);

  // close with a small delay on move leave
  useEffect(() => {
    if (!lastMouseLeave) {
      return;
    }
    return createTimeout(() => {
      setShowPopper(false);
      setLastMouseLeave(null);
    }, closeDelay);
  }, [closeDelay, lastMouseLeave]);

  const popper = usePopper(containerRef, popperRef, {
    placement,
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
        style={style}
        ref={setContainerRef}
        onMouseEnter={() => {
          setShowPopper(true);
          setLastMouseLeave(null);
        }}
        onMouseLeave={() => {
          setLastMouseLeave(Date.now());
        }}
      >
        {children}
        {showPopper &&
          options &&
          ReactDOM.createPortal(
            <PopperContainer
              style={popper.styles.popper}
              {...popper.attributes.popper}
              ref={setPopperRef}
              variants={variants}
              initial="hidden"
              animate="visible"
            >
              {options.map((opt) => (
                <OptionContainer
                  active={opt.key === selected}
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
