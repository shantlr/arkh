import { useMemo } from 'react';

import { forEach } from 'lodash';
import styled, { css } from 'styled-components';

const Container = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: ${(props) => props.theme.space.md};
`;

const stateCss = {
  'all-running': css`
    background-color: ${(props) => props.theme.color.success};
  `,
  'some-running': css`
    background-color: ${(props) => props.theme.color.warning};
    border-color: ${(props) => props.theme.color.warning};
  `,
  'all-exited': css`
    background-color: ${(props) => props.theme.color.secondaryMainBg};
  `,
  'all-off': css``,
};
const Indicator = styled.div<{ state: keyof typeof stateCss }>`
  width: 5px;
  height: 5px;
  border: 2px solid ${(props) => props.theme.color.secondaryMainBg};
  border-radius: 50%;
  background-color: transparent;
  ${(props) => stateCss[props.state]};
  transition: 0.3s;
`;

export const StackStatusIndicator = ({
  serviceStates,
}: {
  serviceStates: Record<string, any>;
}) => {
  const state = useMemo(() => {
    if (!serviceStates) {
      return 'all-off';
    }
    const r = {
      hasRunning: false,
      hasOff: false,
      hasExited: false,
    };
    forEach(serviceStates, (s) => {
      switch (s.state) {
        case 'pending-assignment':
        case 'running': {
          r.hasRunning = true;
          break;
        }
        case 'off': {
          if (s.current_task_state === 'exited') {
            r.hasExited = true;
          } else {
            r.hasOff = true;
          }
          break;
        }
        default:
      }
    });
    if (r.hasRunning && !r.hasOff && !r.hasExited) {
      return 'all-running';
    }
    if (r.hasRunning && (r.hasOff || r.hasExited)) {
      return 'some-running';
    }
    if (!r.hasRunning && r.hasExited && !r.hasOff) {
      return 'all-exited';
    }

    return 'all-off';
  }, [serviceStates]);

  return (
    <Container>
      <Indicator state={state}></Indicator>
    </Container>
  );
};
