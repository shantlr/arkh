import { Stack } from 'configs/types';
import { createTimeout } from 'lib/createTimeout';
import { map } from 'lodash';
import { useEffect } from 'react';
import { useState } from 'react';
import { usePopper } from 'react-popper';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { styles } from 'styles/css';

const Container = styled(motion.div)`
  ${styles.pl.md};
`;

const Item = styled(motion.div)`
  background-color: white;
  padding: ${(props) => `${props.theme.space.sm} ${props.theme.space.lg}`};
  ${styles.shadow.md};
  ${styles.text.sm};
  ${styles.rounded.lg};
  ${styles.mb.sm};
  ${styles.transition.default};
  ${styles.hover.action};
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

export const ServiceDropdownList = ({
  parentRef,
  stack,
}: {
  parentRef: HTMLElement | null;
  stack: Stack;
}) => {
  const [show, setShow] = useState(false);
  const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);
  const popper = usePopper(parentRef, popperRef, {
    placement: 'right',
  });

  useEffect(() => {
    return createTimeout(() => {
      setShow(true);
    }, 200);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <Container
      ref={setPopperRef}
      style={popper.styles.popper}
      {...popper.attributes.popper}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {map(stack.spec.services, (service, key) => (
        <Item key={key} variants={itemVariants}>
          {key}
        </Item>
      ))}
    </Container>
  );
};
