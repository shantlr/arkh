import { useEffect, useState } from 'react';

import ReactDOM from 'react-dom';

import { Placement } from '@popperjs/core';
import { motion } from 'framer-motion';
import { usePopper } from 'react-popper';
import styled, {
  css,
  DefaultTheme,
  FlattenInterpolation,
  ThemeProps,
} from 'styled-components';

import { createTimeout } from 'lib/createTimeout';
import { Children } from 'lib/types';
import { styles } from 'styles/css';

const sizes = {
  sm: css`
    padding: ${(props) => `0 ${props.theme.space.lg}`};
    ${styles.text.xs};
    ${styles.mb.sm};
  `,
  md: css`
    ${styles.text.sm};
    ${styles.mb.sm};
    padding: ${(props) => `${props.theme.space.sm} ${props.theme.space.lg}`};
  `,
};

const placement: Record<
  string,
  FlattenInterpolation<ThemeProps<DefaultTheme>>
> = {
  right: css`
    ${styles.pl.md}
  `,
  bottom: css`
    ${styles.pt.md}
  `,
  left: css`
    ${styles.pr.md}
  `,
  'left-start': css`
    ${styles.pr.md}
  `,
  'left-end': css`
    ${styles.pr.md}
  `,
};
const Container = styled(motion.div)<{
  placement: Placement;
}>`
  ${styles.zIndex.dropdown}
  ${(props) =>
    props.placement in placement ? placement[props.placement] : null};
`;

const Item = styled(motion.div)<{ size?: keyof typeof sizes }>`
  ${styles.bg.mainBg}
  ${styles.color.mainBgColor}
  ${styles.shadow.md};
  ${styles.rounded.lg};
  ${styles.transition.default};
  ${styles.hover.action};
  cursor: pointer;
  ${(props) => (props.size ? sizes[props.size] : null)}
`;

const variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
const itemVariants = {
  hidden: { x: 10, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export const ActionDropdown = ({
  parentRef,
  size = 'md',
  placement = 'right',
  children,
  delay = 0,
}: {
  parentRef?: HTMLElement | null;
  size?: keyof typeof sizes;
  placement?: Placement;
  children?: Children;
  delay?: number;
}) => {
  const [show, setShow] = useState(false);
  const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);
  const popper = usePopper(parentRef, popperRef, {
    placement,
  });

  useEffect(() => {
    return createTimeout(() => {
      setShow(true);
    }, delay);
  }, [delay]);

  if (!show) {
    return null;
  }

  return ReactDOM.createPortal(
    <Container
      ref={setPopperRef}
      variants={variants}
      initial="hidden"
      animate="visible"
      placement={placement}
      style={popper.styles.popper}
      {...popper.attributes.popper}
    >
      {Array.isArray(children) &&
        children.map((ch) => {
          if (!ch) {
            return null;
          }
          return (
            <Item size={size} variants={itemVariants} key={ch.key}>
              {ch}
            </Item>
          );
        })}
      {children && !Array.isArray(children) && (
        <Item variants={itemVariants} size={size}>
          {children}
        </Item>
      )}
    </Container>,
    document.body
  );
};
