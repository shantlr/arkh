import { StackTab } from '@shantr/metro-common-types';
import { Grid, useGridState } from 'components/grid';
import { NoStyleLink } from 'components/noStyleLink';
import { API } from 'configs';
import { useDebouncedState, useUpdateEffect } from 'hooks/utils';
import { map } from 'lodash';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { useMutation } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { styles } from 'styles/css';
import { ServiceLogs } from '../serviceLog';

const Container = styled.div`
  height: 100%;
  width: 100%;
  ${styles.container.noScroll}
`;

const TabContainer = styled.div`
  display: flex;
  ${styles.pl.sm};
`;

const TabItem = styled.div<{ active?: boolean }>`
  cursor: pointer;
  min-width: 40px;
  text-align: center;
  font-weight: bold;
  padding: ${(props) => `0 ${props.theme.space.md}`};
  ${(props) => (props.active ? styles.base.action : styles.base.secondaryBg)};
  ${styles.rounded.lg};
  ${styles.hover.action};
  ${styles.text.sm};
  ${styles.transition.default};
`;

const StackGrid = ({
  stackName,
  tab,
}: {
  stackName: string;
  tab: StackTab;
}) => {
  const grid = useGridState(tab);

  const debouncedGridState = useDebouncedState(grid.state);

  const { mutate: updateTab } = useMutation((tab: StackTab) =>
    API.stack.updateTab(stackName, tab)
  );
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
    <Grid grid={grid} dropAcceptType="cell">
      {map(tab.keys, (v, key) => (
        <ServiceLogs key={key} fullName={key} dragType="cell" />
      ))}
    </Grid>
  );
};

export const StackTabs = ({
  stackName,
  tabs,
}: {
  stackName: string;
  tabs: StackTab[];
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
    if (!tabKey && tabs.length) {
      navigate(`t/${tabs[0].slug}`);
    }
  }, [navigate, tabKey, tabs]);

  return (
    <Container>
      <TabContainer>
        {tabs.map((tab) => (
          <NoStyleLink to={`t/${tab.slug}`} key={tab.slug}>
            <TabItem active={tabKey === tab.slug}>{tab.name}</TabItem>
          </NoStyleLink>
        ))}
      </TabContainer>
      {selectedTab && (
        <StackGrid
          stackName={stackName}
          key={selectedTab.slug}
          tab={selectedTab}
        />
      )}
    </Container>
  );
};
