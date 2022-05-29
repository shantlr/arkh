import { Stack, StackTab } from '@shantlr/shipyard-common-types';
import { Grid, useGridState } from 'components/grid';
import { useUpdateStackTab } from 'hooks/query';
import { useDebouncedState, useUpdateEffect } from 'hooks/utils';
import { map } from 'lodash';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { styles } from 'styles/css';
import { AvailableServiceList } from '../availableServices';
import { ServiceLogs } from '../serviceLog';
import { StackTabList } from './tabList';

const Container = styled.div`
  height: 100%;
  width: 100%;
  ${styles.container.noScroll}
`;

const StackGrid = ({
  stackName,
  tab,
  dragType,
}: {
  stackName: string;
  tab: StackTab;
  dragType: string;
}) => {
  const grid = useGridState(tab);

  const debouncedGridState = useDebouncedState(grid.state);
  const { mutate: updateTab } = useUpdateStackTab(stackName);

  // Sync keys for default tab
  useEffect(() => {
    if (Object.keys(tab.keys).length && !grid.state.rows.length) {
      grid.dispatch({ type: 'sync-keys', childKeys: tab.keys });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useUpdateEffect(
    useCallback(() => {
      updateTab({
        ...tab,
        keys: debouncedGridState.keys,
        rows: debouncedGridState.rows,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedGridState.updated_at])
  );

  return (
    <Grid grid={grid} dropAcceptType={dragType}>
      {map(grid.state.keys, (v, key) => (
        <ServiceLogs
          key={key}
          fullName={key}
          dragType={dragType}
          onDelete={() => {
            grid.dispatch({
              type: 'remove-cell',
              key,
            });
          }}
        />
      ))}
    </Grid>
  );
};

export const StackTabs = ({
  stack,
  tabs,
  dragType = 'grid-cell',
}: {
  stack: Stack;
  tabs: StackTab[];
  dragType?: string;
}) => {
  const { tabKey } = useParams();

  const selectedTab = useMemo(() => {
    if (!tabKey) {
      return null;
    }
    return tabs.find((tab) => tab.slug === tabKey);
  }, [tabKey, tabs]);

  const navigate = useNavigate();
  useEffect(() => {
    if (!tabs) {
      return;
    }

    if (
      (!tabKey && tabs.length) ||
      (tabKey && tabs.findIndex((t) => t.slug === tabKey) === -1)
    ) {
      navigate(`t/${tabs[0].slug}`);
    }
  }, [navigate, tabKey, tabs]);

  return (
    <Container>
      <StackTabList stack={stack} tabs={tabs} selectedTabSlug={tabKey} />
      <AvailableServiceList
        stack={stack}
        tabs={tabs}
        selectedTabSlug={tabKey}
        dragType={dragType}
      />
      {selectedTab && (
        <StackGrid
          stackName={stack.name}
          key={selectedTab.slug}
          tab={selectedTab}
          dragType={dragType}
        />
      )}
    </Container>
  );
};
