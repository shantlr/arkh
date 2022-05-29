import { useState } from 'react';
import { usePopper } from 'react-popper';
import styled, { css } from 'styled-components';

import { BaseCard } from 'components/card';
import { useStackServiceStates, useSubscribeServiceStates } from 'hooks/query';
import { StackStatusIndicator } from './indicator';
import { RunStack } from './runStack';
import { styles } from 'styles/css';
import { useEffect } from 'react';
import { CSSProperties } from 'react';
import { ServiceDropdownList } from '../serviceDropdownList';
import { createTimeout } from 'lib/createTimeout';
import { Stack } from '@shantlr/shipyard-common-types';

const StackHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  flex-wrap: nowrap;
`;
const StackTitle = styled.div`
  ${styles.container.textEllipsis};
  ${styles.transition.default};
  flex-grow: 1;
  line-height: 14px;
  font-weight: bold;
`;

const StyledRunStack = styled(RunStack)``;

type CardProps = {
  active?: boolean;
  withHoverCss?: boolean;
};

const StackHeaderActions = styled.div`
  display: flex;
  align-items: center;
  margin-left: ${(props) => props.theme.space.md};
`;

const hoverCss = css<CardProps>`
  :hover {
    ${styles.shadow.md};

    ${StyledRunStack} {
      width: 20px;
      opacity: 1;
    }
  }
`;
const StackCardContainer = styled(BaseCard)<CardProps>`
  position: relative;
  ${styles.rounded.lg};
  ${styles.mb.md};
  ${styles.text.xs};
  ${styles.padding.sm};

  cursor: pointer;
  transition: all 0.5s;

  ${StyledRunStack} {
    width: ${(props) => (props.active ? `20px` : '0px')};
    opacity: ${(props) => (props.active ? 1 : 0)};
    overflow: hidden;
  }

  ${(props) => (props.withHoverCss ? hoverCss : null)};
`;

const StackCardBase = ({
  style,
  active,
  stack,
  children,
  serviceStates,
  setContainerRef,
  onMouseEnter,

  withHoverCss,
}: {
  style?: CSSProperties;
  active: boolean;
  stack: Stack;
  children?: JSX.Element | boolean | null;

  serviceStates: any;
  setContainerRef?: (elem: HTMLDivElement) => void;
  onMouseEnter?: () => void;
  withHoverCss?: boolean;
}) => {
  const [hoverCss, setHoverCss] = useState(false);

  useEffect(() => {
    if (withHoverCss) {
      setHoverCss(true);
    }
  }, [withHoverCss]);

  return (
    <StackCardContainer
      style={style}
      ref={setContainerRef}
      withHoverCss={hoverCss}
      active={active}
      onMouseEnter={onMouseEnter}
    >
      <StackHeader>
        <StackStatusIndicator serviceStates={serviceStates} />
        <StackTitle>{stack.name}</StackTitle>
        <StackHeaderActions>
          <StyledRunStack stackName={stack.name} />
        </StackHeaderActions>
      </StackHeader>

      {children}
    </StackCardContainer>
  );
};

export const StackCard = ({
  active,
  stack,
}: {
  active: boolean;
  stack: Stack;
}) => {
  const { data: serviceStates } = useStackServiceStates(stack.name);
  useSubscribeServiceStates(stack.name);

  const [showPopper, setShowPopper] = useState(false);
  const [hasEnteredPopper, setHasEnteredPopper] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null);
  const popper = usePopper(containerRef, popperRef, {
    strategy: 'fixed',
    placement: 'top-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, -32],
        },
      },
    ],
  });

  const [servicesContainerRef, setServicesContainerRef] =
    useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showPopper) {
      setHasEnteredPopper(false);
    }
  }, [showPopper]);

  // Clean relicas
  useEffect(() => {
    if (showPopper && !hasEnteredPopper) {
      return createTimeout(() => {
        setShowPopper(false);
        setHasEnteredPopper(false);
      }, 600);
    }
  }, [showPopper, hasEnteredPopper]);

  return (
    <>
      <StackCardBase
        stack={stack}
        active={active}
        setContainerRef={setContainerRef}
        serviceStates={serviceStates}
        onMouseEnter={() => {
          setShowPopper(true);
        }}
      />
      {showPopper && (
        <div
          ref={setPopperRef}
          style={{
            ...popper.styles.popper,
            minWidth: containerRef ? containerRef.offsetWidth : undefined,
            zIndex: 999,
          }}
          onMouseEnter={() => {
            setHasEnteredPopper(true);
          }}
          onMouseLeave={() => {
            setShowPopper(false);
          }}
        >
          <StackCardBase
            setContainerRef={setServicesContainerRef}
            active={active}
            stack={stack}
            serviceStates={serviceStates}
            withHoverCss
          />
          <ServiceDropdownList parentRef={servicesContainerRef} stack={stack} />
        </div>
      )}
    </>
  );
};
