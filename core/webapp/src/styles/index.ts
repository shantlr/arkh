// https://www.happyhues.co/palettes/4

export const theme = {
  color: {
    bg: `#16161a`,
    bgColor: 'white',

    // mainBg: '#E0E5EB',
    // mainBg: '#F5F8FD',
    mainBg: '#F2F1F7',

    // actionBg: `#7f5af0`,
    actionBg: `#7452D4`,
    actionColor: '#fffffe',

    sideBarBg: 'white',
    sideBarColor: '#46454B',

    actionSecondary: '#fec7d7',
    actionSecondaryColor: '#0e172c',

    highlightBg: '#7f5af0',
    hightlightColor: 'white',

    secondaryBg: '#72757e',

    title: '#fffffe',

    text: '#94a1b2',
    textLight: '#E0E5EB',
  },
  borderRadius: {
    md: `4px`,
    lg: `12px`,
    round: '50%',
  },
  space: {
    sm: `4px`,
    md: `6px`,
    lg: `12px`,
  },

  fontSize: {
    sm: `12px`,
  },
  shadow: {
    md: `var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`,
  },
};

type Theme = typeof theme;

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
