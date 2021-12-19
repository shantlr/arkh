import styled, { css } from 'styled-components';

const sizeCss = {
  sm: css`
    font-size: ${(props) => props.theme.fontSize.sm};
  `,
};

export const Text = styled.span<{
  size?: keyof typeof sizeCss;
}>`
  ${(props) => (props.size ? sizeCss[props.size] : null)};
`;
