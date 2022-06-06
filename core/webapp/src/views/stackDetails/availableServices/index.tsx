import { useEffect, useMemo } from 'react';

import { Stack, StackTab } from '@shantlr/shipyard-common-types';
import { reduce } from 'lodash';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import styled from 'styled-components';

import { styles } from 'styles/css';

const Container = styled.div`
  ${styles.padding.sm}
  display: flex;
`;
const ServiceContainer = styled.div`
  min-width: 40px;
  padding: ${(props) => `0 ${props.theme.space.md}`};
  cursor: grab;
  ${styles.flex.bothCenter}
  ${styles.mr.sm}
  ${styles.text.sm};
  ${styles.rounded.lg};
  ${styles.bg.secondaryMainBg}
  ${styles.hover.action};
  ${styles.transition.default}
`;

const Service = ({
  name,
  dragType,
  serviceKey,
}: {
  name: string;
  dragType: string;
  serviceKey: string;
}) => {
  const [, drag, dragPreview] = useDrag(
    {
      type: dragType,
      item: {
        id: name,
        taskId: null,
        rowIndex: null,
        cellIndex: null,
      },
    },
    [name]
  );

  // disable default preview
  useEffect(() => {
    dragPreview(getEmptyImage());
  }, [dragPreview]);

  return <ServiceContainer ref={drag}>{serviceKey}</ServiceContainer>;
};

export const AvailableServiceList = ({
  selectedTabSlug,
  tabs,
  stack,
  dragType,
}: {
  selectedTabSlug?: string;
  tabs: StackTab[];
  stack: Stack;
  dragType: string;
}) => {
  const tab = useMemo(() => {
    if (selectedTabSlug) {
      return tabs.find((tab) => tab.slug === selectedTabSlug);
    }
    return null;
  }, [selectedTabSlug, tabs]);

  const availableServices = useMemo(() => {
    if (!stack || !tab) {
      return [];
    }
    return reduce(
      stack.spec.services,
      (acc, service, serviceKey) => {
        const name = `${stack.name}.${serviceKey}`;
        if (!tab.keys[name]) {
          acc.push({
            name,
            key: serviceKey,
          });
        }
        return acc;
      },
      [] as { name: string; key: string }[]
    );
  }, [stack, tab]);

  if (!availableServices.length) {
    return null;
  }

  return (
    <Container>
      {availableServices.map(({ name, key }) => (
        <Service key={name} name={name} serviceKey={key} dragType={dragType} />
      ))}
    </Container>
  );
};
