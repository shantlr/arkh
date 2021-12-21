import styled, { css } from 'styled-components';

const base = {
  secondary: css`
    background-color: ${(props) => props.theme.color.secondaryMainBg};
    color: ${(props) => props.theme.color.secondaryMainColor};
  `,
  default: css`
    background-color: white;
  `,
  active: css`
    background-color: ${(props) => props.theme.color.actionBg};
    color: ${(props) => props.theme.color.actionColor};
  `,
};

const active = {
  secondary: css``,
  default: css`
    border-color: ${(props) => props.theme.color.actionBg};
    box-shadow: ${(props) => props.theme.shadow.md};
  `,
  active: css``,
};

export type BaseCardProps = {
  t?: keyof typeof base;
  active?: boolean;
};
export const BaseCard = styled.div<{
  t?: keyof typeof base;
  active?: boolean;
}>`
  border: 2px solid transparent;
  ${(props) => base[props.t || 'default']};
  ${(props) => (props.active ? active[props.t || 'default'] : null)};
  padding: ${(props) => props.theme.space.lg};
  box-sizing: border-box;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  transition: ${(props) => props.theme.transition.default};
`;
