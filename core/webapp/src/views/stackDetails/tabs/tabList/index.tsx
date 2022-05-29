import { Stack, StackTab } from '@shantlr/shipyard-common-types';
import { NoStyleLink } from 'components/noStyleLink';
import {
  useCreateStackTab,
  useDeleteStackTab,
  useRenameStackTab,
} from 'hooks/query';
import { useState } from 'react';
import styled from 'styled-components';
import { styles } from 'styles/css';
import { Tab } from './tab';

const AddTabPlaceholder = styled.div`
  min-width: 40px;
  cursor: pointer;

  padding: ${(props) => `0 ${props.theme.space.md}`};
  opacity: 0;
  ${styles.rounded.lg};
  ${styles.text.sm};
  ${styles.bg.secondaryMainBg}
  ${styles.color.secondaryMainColor}
  ${styles.transition.default}
  ${styles.flex.bothCenter}
  :hover {
    filter: brightness(0.9);
  }
`;
const TabContainer = styled.div`
  display: flex;
  ${styles.pl.sm};
  :hover {
    ${AddTabPlaceholder} {
      opacity: 1;
    }
  }
`;

export const StackTabList = ({
  stack,
  tabs,
  selectedTabSlug,
}: {
  stack: Stack;
  tabs: StackTab[];
  selectedTabSlug?: string;
}) => {
  const { mutate: renameTab } = useRenameStackTab(stack.name);
  const { mutate: deleteTab } = useDeleteStackTab();
  const { mutate: createTab } = useCreateStackTab();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <TabContainer>
      {tabs.map((tab) => (
        <NoStyleLink to={`t/${tab.slug}`} key={tab.slug}>
          <Tab
            active={selectedTabSlug === tab.slug}
            name={tab.name}
            onChange={(name) => {
              if (!name) {
                return;
              }

              renameTab({
                oldName: tab.name,
                newName: name,
              });
            }}
            onDelete={() => {
              deleteTab({
                stackName: stack.name,
                tabName: tab.name,
              });
            }}
          />
        </NoStyleLink>
      ))}
      {!showAdd && (
        <AddTabPlaceholder
          onClick={() => {
            setShowAdd(true);
          }}
        >
          new tab
        </AddTabPlaceholder>
      )}
      {showAdd && (
        <Tab
          name=""
          defaultEdit
          onChange={(tabName) => {
            if (tabName) {
              createTab({ stackName: stack.name, tabName });
            }
            setShowAdd(false);
          }}
        />
      )}
    </TabContainer>
  );
};
