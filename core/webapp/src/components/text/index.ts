import styled, { css } from 'styled-components';
import { styles } from 'styles/css';

const sizeCss = {
  sm: css`
    ${styles.text.sm}
  `,
  md: css`
    ${styles.text.md}
  `,
  lg: css`
    ${styles.text.lg}
  `,
};

const typeCss = {
  error: css`
    ${styles.color.danger}
  `,
};

export const Text = styled.span<{
  t?: keyof typeof typeCss;
  size?: keyof typeof sizeCss;
}>`
  ${(props) => sizeCss[props.size || 'sm']};
  ${(props) => (props.t ? typeCss[props.t] : null)}
`;
