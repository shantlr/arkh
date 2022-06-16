import styled, { DefaultTheme } from 'styled-components';

const mapping = {
  mt: ['margin-top', 'space'],
  mr: ['margin-right', 'space'],
  mb: ['margin-bottom', 'space'],
  ml: ['margin-left', 'space'],

  pt: ['padding-top', 'space'],
  pr: ['padding-right', 'space'],
  pb: ['padding-bottom', 'space'],
  pl: ['padding-left', 'space'],
} as const;

type Mapping = typeof mapping;

export type StyleProps = {
  [key in keyof Mapping]?: keyof DefaultTheme[Mapping[key][1]];
};

export const mapStylePropsToCss = (
  props: StyleProps & {
    theme: DefaultTheme;
  }
): string => {
  let res: string[] = [];
  for (const key of Object.keys(props)) {
    if (key in mapping) {
      const [styleName, themeName] = mapping[key as keyof Mapping];
      const valueKey = props[key as keyof Mapping];
      if (valueKey) {
        res.push(`${styleName}: ${props.theme[themeName][valueKey]};`);
      }
    }
  }
  return res.join('\n');
};

export const Box = styled.div<StyleProps>`
  ${mapStylePropsToCss};
`;
