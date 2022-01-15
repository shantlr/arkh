// https://www.happyhues.co/palettes/4

const darkTextColor = '#46454B';

export const theme = {
  color: {
    bg: `#16161a`,
    bgColor: 'white',

    mainBg: 'white',
    mainBgColor: darkTextColor,

    // secondaryBg: '#72757e',
    // secondaryMainBg: '#E0E5EB',
    // secondaryMainBg: '#F5F8FD',
    secondaryMainBg: '#F2F1F7',
    secondaryMainColor: darkTextColor,

    mainHighlightBg: '#F7F7FC',

    // actionBg: `#7f5af0`,
    actionBg: `#7452D4`,
    actionColor: '#fffffe',

    sideBarBg: 'white',
    sideBarColor: darkTextColor,

    actionSecondary: '#fec7d7',
    actionSecondaryColor: '#0e172c',

    highlightBg: '#7f5af0',
    hightlightColor: 'white',

    title: '#fffffe',

    // text: '#94a1b2',
    text: darkTextColor,
    textLight: '#E0E5EB',

    success: '#3ED383',
    successColor: 'white',
    warning: '#fbbf24',

    danger: '#ef4444',
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
    xxs: `6px`,
    xs: `10px`,
    sm: `12px`,
    md: `14px`,
    lg: `18px`,
  },
  shadow: {
    md: `var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`,
  },

  zIndex: {
    dropdown: 999,
    overDropdown: 1000,
  },

  logs: {
    bg: `#1c242a`,
    color: `#eff0fc`,
    noLogColor: `#8d8e8d`,
    timestampColor: '#8d8e8d',
    timeDeltaColor: `#fed7aa`,

    json: {
      string: `lightgreen`,
      number: `yellow`,
      property: `lightblue`,
      null: 'gray',
      indent: 4,
    },
  },
  transition: {
    default: `.3s`,
  },
};

type Theme = typeof theme;

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
