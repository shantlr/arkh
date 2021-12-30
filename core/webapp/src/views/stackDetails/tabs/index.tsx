import { StackTab } from '@shantr/metro-common-types';
import { Grid, useGridState } from 'components/grid';
import { NoStyleLink } from 'components/noStyleLink';
import { API } from 'configs';
import { QUERY_KEY } from 'hooks/query/key';
import { useDebouncedState, useUpdateEffect } from 'hooks/utils';
import { map } from 'lodash';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { styles } from 'styles/css';
import { ServiceLogs } from '../serviceLog';
import { Tab } from './tab';

const Container = styled.div`
  height: 100%;
  width: 100%;
  ${styles.container.noScroll}
`;

const TabContainer = styled.div`
  display: flex;
  ${styles.pl.sm};
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

const useRenameTab = (stackName: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation(
    ({ oldName, newName }: { oldName: string; newName: string }) =>
      API.stack.renameTab(stackName, oldName, newName),
    {
      onMutate({ oldName, newName }) {
        const newSlug = newName.replace(/[]+/, '-').toLowerCase();
        queryClient.setQueryData(QUERY_KEY.stack.tabs(stackName), (data) => {
          if (!data) {
            return data;
          }

          return (data as StackTab[]).map((tab) => {
            if (tab.name === oldName) {
              return {
                ...tab,
                name: newName,
                slug: newSlug,
              };
            }
            return tab;
          });
        });
        navigate(`t/${newSlug}`);
      },
    }
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
  const { mutate: renameTab } = useRenameTab(stackName);

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
            <Tab
              active={tabKey === tab.slug}
              name={tab.name}
              onChange={(name) => {
                renameTab({
                  oldName: tab.name,
                  newName: name,
                });
              }}
            />
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
