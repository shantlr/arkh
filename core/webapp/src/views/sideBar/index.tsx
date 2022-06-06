import { faCog, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMatch } from 'react-router';
import styled from 'styled-components';

import { NoStyleLink } from 'components/noStyleLink';
import { styles } from 'styles/css';

const WIDTH = '28px';

const Container = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  box-sizing: border-box;
  width: ${WIDTH};
  min-width: ${WIDTH};
  background-color: ${(props) => props.theme.color.sideBarBg};

  transition: 0.5s;
  ${styles.zIndex.dropdown}
  :hover {
    ${styles.zIndex.overDropdown}
  }
`;

const BarCard = styled.div`
  box-sizing: border-box;
  height: 100%;
  ${styles.bg.sideBarBg};
  ${styles.pt.lg};
  ${styles.pr.md};
  ${styles.transition.default};
  ${styles.roundedTopRight.lg};
  ${styles.roundedBottomRight.lg};
`;

const MenuItem = styled.div<{ active?: boolean }>`
  color: ${(props) =>
    props.active ? props.theme.color.actionBg : props.theme.color.textLight};
  background-color: transparent;
  display: flex;
  cursor: pointer;
  transition: all 0.5s;
  font-size: 16px;

  ${styles.mb.lg};
  ${styles.padding.md};
  ${styles.rounded.lg};

  :hover {
    ${styles.shadow.md};
  }
  :active {
    filter: brightness(1.3);
  }
`;
const MenuTitle = styled.span`
  overflow: hidden;
  width: 0px;
  transition: 1s;
  text-decoration: none;
  opacity: 0;
  ${styles.text.sm};
  ${styles.transition.default};
`;
const BarContainer = styled.div`
  height: 100%;
  box-sizing: border-box;
  padding: ${(props) => `${props.theme.space.lg} 0`};
  width: ${WIDTH};
  transition: 0.5s;
  :hover {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 130px;
    z-index: ${styles.zIndex.dropdown};

    ${BarCard} {
      ${styles.pl.md};
      box-shadow: 2px 0px 15px 2px rgba(0, 0, 0, 0.06);
      ${MenuItem} {
        ${styles.text.lg};
        ${MenuTitle} {
          ${styles.ml.md};
          opacity: 1;
          width: auto;
          font-weight: bold;
        }
      }
    }
  }
`;

export const SideBar = () => {
  const match = useMatch('/:name/*');

  return (
    <Container>
      <BarContainer>
        <BarCard>
          <NoStyleLink to="/stack">
            <MenuItem active={Boolean(match && match.params.name === 'stack')}>
              <FontAwesomeIcon icon={faLayerGroup} />
              <MenuTitle>Stacks</MenuTitle>
            </MenuItem>
          </NoStyleLink>

          <NoStyleLink to="/settings">
            <MenuItem
              active={Boolean(match && match.params.name === 'settings')}
            >
              <FontAwesomeIcon icon={faCog} />
              <MenuTitle> Settings</MenuTitle>
            </MenuItem>
          </NoStyleLink>
        </BarCard>
      </BarContainer>
    </Container>
  );
};
