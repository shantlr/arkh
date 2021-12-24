import styled, { css } from 'styled-components';
import { styles } from 'styles/css';

const sizeCss = {
  sm: css`
    padding: 4px 6px;
    font-size: ${(props) => props.theme.fontSize.xxs};
  `,
  md: css`
    padding: 5px 8px;
  `,
};

export const Button = styled.button<{
  size?: keyof typeof sizeCss;
  rounded?: boolean;
}>`
  cursor: pointer;
  border: none;
  background: ${(props) => props.theme.color.actionBg};
  color: ${(props) => props.theme.color.actionColor};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: ${(props) => props.theme.borderRadius.md};
  ${(props) => (props.rounded ? styles.rounded.round : null)};

  ${(props) => sizeCss[props.size || 'md']}

  transition: all 0.3s;
  :hover {
    opacity: 0.8;
  }
  :active {
    opacity: 0.9;
  }
`;
