import { Placement } from '@popperjs/core';
import { motion } from 'framer-motion';
import { createTimeout } from 'lib/createTimeout';
import { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import styled, { css } from 'styled-components';
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
const Container = styled(motion.div)`
  ${styles.pl.md};
  ${styles.zIndex.dropdown}
`;

const Item = styled(motion.div)<{ size?: keyof typeof sizes }>`
  ${styles.bg.mainBg}
  ${styles.color.mainBgColor}
  ${styles.shadow.md};
  ${styles.rounded.lg};
  ${styles.transition.default};
  ${styles.hover.action};
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
  delay = 200,
}: {
  parentRef?: HTMLElement | null;
  size?: keyof typeof sizes;
  placement?: Placement;
  children?: JSX.Element | JSX.Element[];
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

  return (
    <Container
      ref={setPopperRef}
      variants={variants}
      initial="hidden"
      animate="visible"
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
    </Container>
  );
};
