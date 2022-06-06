import styled, { css } from 'styled-components';

import { mapStylePropsToCss, StyleProps } from 'components/box';
import { styles } from 'styles/css';

const sizeCss = {
  xxs: css`
    ${styles.text.xxs}
  `,
  xs: css`
    ${styles.text.xs}
  `,
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

export const Text = styled.span<
  {
    t?: keyof typeof typeCss;
    size?: keyof typeof sizeCss;
  } & StyleProps
>`
  ${mapStylePropsToCss};
  ${(props) => sizeCss[props.size || 'sm']};
  ${(props) => (props.t ? typeCss[props.t] : null)}
`;
