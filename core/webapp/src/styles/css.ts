import {
  css,
  DefaultTheme,
  FlattenInterpolation,
  ThemeProps,
} from 'styled-components';

export const createCssThemeProxy = <ProxyKey extends string>(
  cssProperty: string,
  extractCssValue: (props: ThemeProps<DefaultTheme>, property: ProxyKey) => any
) => {
  // @ts-ignore
  const cache: Record<
    ProxyKey,
    FlattenInterpolation<ThemeProps<DefaultTheme>>
  > = {};
  return new Proxy(cache, {
    get(target, property: ProxyKey) {
      if (!target[property]) {
        // if property missing, compute css
        const interpolation = css`
          ${cssProperty}: ${(props) => extractCssValue(props, property)};
        `;
        // save in cache
        target[property] = interpolation;
      }

      // return computed css
      return target[property];
    },
  });
};

export const createCssThemeKeyProxy = <
  ThemeKey extends string & keyof DefaultTheme,
  ProxyAccessibleKeys extends string &
    keyof DefaultTheme[ThemeKey] = DefaultTheme[ThemeKey] extends Record<
    string,
    infer T
  >
    ? keyof T
    : never
>(
  cssProperty: string,
  themeField: ThemeKey
) => {
  return createCssThemeProxy<ProxyAccessibleKeys>(
    cssProperty,
    (props, property) => props.theme[themeField][property]
  );
};

export const styles = {
  base: {
    mainBg: css`
      background-color: ${(props) => props.theme.color.mainBg};
      color: ${(props) => props.theme.color.mainBgColor};
    `,
    secondaryBg: css`
      background-color: ${(props) => props.theme.color.secondaryMainBg};
      color: ${(props) => props.theme.color.secondaryMainColor};
    `,
    successBg: css`
      background-color: ${(props) => props.theme.color.success};
      color: ${(props) => props.theme.color.successColor};
    `,
  },

  color: createCssThemeKeyProxy('color', 'color'),

  margin: createCssThemeKeyProxy('margin', 'space'),
  mt: createCssThemeKeyProxy('margin-top', 'space'),
  mr: createCssThemeKeyProxy('margin-right', 'space'),
  mb: createCssThemeKeyProxy('margin-bottom', 'space'),
  ml: createCssThemeKeyProxy('margin-left', 'space'),

  padding: createCssThemeKeyProxy('padding', 'space'),
  pt: createCssThemeKeyProxy('padding-top', 'space'),
  pr: createCssThemeKeyProxy('padding-right', 'space'),
  pb: createCssThemeKeyProxy('padding-bottom', 'space'),
  pl: createCssThemeKeyProxy('padding-left', 'space'),

  text: createCssThemeKeyProxy('font-size', 'fontSize'),
  rounded: createCssThemeKeyProxy('border-radius', 'borderRadius'),
  flex: {
    bothCenter: css`
      display: flex;
      align-items: center;
      justify-content: center;
    `,
  },
  transition: createCssThemeKeyProxy('transition', 'transition'),
  shadow: createCssThemeKeyProxy('box-shadow', 'shadow'),

  container: {
    noScroll: css`
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `,
    textEllipsis: css`
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    `,
  },
  hover: {
    textAction: css`
      :hover {
        color: ${(props) => props.theme.color.actionBg};
      }
    `,
    action: css`
      :hover {
        background-color: ${(props) => props.theme.color.actionBg};
        color: ${(props) => props.theme.color.actionColor};
      }
    `,
  },
};
