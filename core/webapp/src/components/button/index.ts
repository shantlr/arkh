import styled, { css } from 'styled-components';

const sizeCss = {
  sm: css`
    /* padding: 5px 8px; */
    padding: 2px 4px;
    font-size: ${(props) => props.theme.fontSize.xs};
  `,
  md: css`
    padding: 5px 8px;
  `,
};

export const Button = styled.button<{ size?: keyof typeof sizeCss }>`
  cursor: pointer;
  border: none;
  background: ${(props) => props.theme.color.actionBg};
  color: ${(props) => props.theme.color.actionColor};

  border-radius: ${(props) => props.theme.borderRadius.md};

  ${(props) => sizeCss[props.size || 'md']}

  transition: all 0.3s;
  :hover {
    opacity: 0.8;
  }
  :active {
    opacity: 0.9;
  }
`;
