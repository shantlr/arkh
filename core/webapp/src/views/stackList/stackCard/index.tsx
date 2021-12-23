import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { map } from 'lodash';
import { useState } from 'react';
import { usePopper } from 'react-popper';
import { useMutation } from 'react-query';
import styled, { css } from 'styled-components';

import { Button } from 'components/button';
import { BaseCard } from 'components/card';
import { Text } from 'components/text';
import { API } from 'configs';
import { Stack } from 'configs/types';
import { useStackServiceStates, useSubscribeServiceStates } from 'hooks/query';
import { StackStatusIndicator } from './indicator';
import { RunStack } from './runStack';
import { styles } from 'styles/css';
import { useEffect } from 'react';
import { CSSProperties } from 'react';
import { ServiceDropdownList } from '../serviceDropdownList';

const StackHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  flex-wrap: nowrap;
  margin-bottom: ${(props) => props.theme.space.md};
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
  shrinked?: boolean;
  active?: boolean;
  withHoverCss?: boolean;
};

const StackHeaderActions = styled.div<{ shrinked?: boolean }>`
  display: flex;
  align-items: center;
  margin-left: ${(props) => props.theme.space.md};
`;
const ServiceList = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const stateCss = {
  running: css`
    border-color: transparent;
    ${styles.base.successBg};
  `,
  exited: css`
    border-color: transparent;
    ${styles.base.secondaryBg};
  `,
};

const ServiceItem = styled.div<{ state?: keyof typeof stateCss }>`
  ${styles.rounded.md};
  ${styles.mr.md};
  ${styles.padding.sm};
  ${styles.transition.default};
  margin-bottom: 2px;
  display: flex;
  justify-content: space-between;
  color: ${(props) => props.theme.color.text};
  ${(props) => (props.state ? stateCss[props.state] : null)};

  border: 1px solid ${(props) => props.theme.color.secondaryMainBg};

  :hover {
    border-color: transparent;
    color: ${(props) => props.theme.color.text};
    background-color: ${(props) => props.theme.color.mainHighlightBg};
    ${styles.shadow.md};
  }
`;

const shrinkedCss = css<CardProps>`
  font-size: ${(props) => props.theme.fontSize.sm};
  padding: ${(props) => props.theme.space.sm};

  ${StackHeader} {
    margin-bottom: 0;
  }

  ${StyledRunStack} {
    width: ${(props) => (props.active ? `20px` : '0px')};
    opacity: ${(props) => (props.active ? 1 : 0)};
    overflow: hidden;
  }
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
  ${styles.padding.lg};
  ${styles.rounded.lg};
  ${styles.mb.md};

  cursor: pointer;
  transition: all 0.5s;

  ${(props) => (props.shrinked ? shrinkedCss : null)};
  ${(props) => (props.withHoverCss ? hoverCss : null)};
`;

const StackCardBase = ({
  style,
  active,
  stack,
  shrinked,
  children,
  serviceStates,
  setContainerRef,
  onMouseEnter,

  withHoverCss,
}: {
  style?: CSSProperties;
  active: boolean;
  stack: Stack;
  shrinked?: boolean;
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
      shrinked={shrinked}
      withHoverCss={hoverCss}
      active={active}
      onMouseEnter={onMouseEnter}
    >
      <StackHeader>
        <StackStatusIndicator serviceStates={serviceStates} />
        <StackTitle>{stack.name}</StackTitle>
        <StackHeaderActions>
          <StyledRunStack shrinked={shrinked} stackName={stack.name} />
        </StackHeaderActions>
      </StackHeader>

      {children}
    </StackCardContainer>
  );
};

export const StackCard = ({
  active,
  stack,
  shrinked,
}: {
  active: boolean;
  stack: Stack;
  shrinked?: boolean;
}) => {
  const { data: serviceStates } = useStackServiceStates(stack.name);
  useSubscribeServiceStates(stack.name);

  const { mutate: runService } = useMutation(
    ({ serviceName }: { serviceName: string }) =>
      API.service.run({ name: serviceName })
  );

  const [showPopper, setShowPopper] = useState(false);
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
    if (!shrinked && showPopper) {
      setShowPopper(false);
    }
  }, [showPopper, shrinked]);

  return (
    <>
      <StackCardBase
        stack={stack}
        active={active}
        shrinked={shrinked}
        setContainerRef={setContainerRef}
        serviceStates={serviceStates}
        onMouseEnter={() => {
          if (!shrinked) {
            return;
          }
          setShowPopper(true);
        }}
      >
        {!shrinked && (
          <ServiceList>
            {map(stack.spec.services, (service, serviceKey) => (
              <ServiceItem
                key={serviceKey}
                state={
                  serviceStates && serviceStates[serviceKey]
                    ? serviceStates[serviceKey].current_task_state
                    : 'off'
                }
              >
                <Text style={{ marginRight: 5 }}>{serviceKey}</Text>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    runService({
                      serviceName: `${stack.name}.${serviceKey}`,
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} />
                </Button>
              </ServiceItem>
            ))}
          </ServiceList>
        )}
      </StackCardBase>
      {showPopper && (
        <div
          ref={setPopperRef}
          style={{
            ...popper.styles.popper,
            minWidth: containerRef ? containerRef.offsetWidth : undefined,
            zIndex: 999,
          }}
          onMouseLeave={() => {
            setShowPopper(false);
          }}
        >
          <StackCardBase
            setContainerRef={setServicesContainerRef}
            active={active}
            stack={stack}
            shrinked
            serviceStates={serviceStates}
            withHoverCss
          />
          <ServiceDropdownList parentRef={servicesContainerRef} stack={stack} />
        </div>
      )}
    </>
  );
};
