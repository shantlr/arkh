import styled, { css } from 'styled-components';
import { styles } from 'styles/css';

const sizeCss = {
  sm: css`
    ${styles.text.sm}
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
  ${(props) => (props.size ? sizeCss[props.size] : null)};
  ${(props) => (props.t ? typeCss[props.t] : null)}
`;
