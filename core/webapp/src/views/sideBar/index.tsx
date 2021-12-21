import { faCog, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NoStyleLink } from 'components/noStyleLink';
import { useMatch } from 'react-router';
import styled from 'styled-components';

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
  z-index: 9999;
  background-color: ${(props) => props.theme.color.sideBarBg};

  transition: 0.5s;
`;

const BarCard = styled.div`
  background-color: ${(props) => props.theme.color.sideBarBg};
  box-sizing: border-box;
  padding-top: ${(props) => props.theme.space.lg};
  height: 100%;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  transition: 0.5s;
`;

const MenuItem = styled.div<{ active?: boolean }>`
  color: ${(props) =>
    props.active ? props.theme.color.actionBg : props.theme.color.textLight};
  margin-bottom: ${(props) => props.theme.space.lg};
  padding: ${(props) => props.theme.space.md};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  background-color: transparent;

  display: flex;
  cursor: pointer;

  transition: all 0.5s;
  font-size: 16px;
  :hover {
    box-shadow: ${(props) => props.theme.shadow.md};
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
  font-size: ${(props) => props.theme.fontSize.sm};
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
    z-index: 9999;
    padding: ${(props) => `${props.theme.space.lg} ${props.theme.space.lg}`};
    padding-left: 10px;

    ${BarCard} {
      padding: ${(props) => props.theme.space.lg};
      box-shadow: ${(props) => props.theme.shadow.md};
      ${MenuItem} {
        font-size: 20px;
        ${MenuTitle} {
          margin-left: ${(props) => props.theme.space.md};
          opacity: 1;
          width: auto;
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
