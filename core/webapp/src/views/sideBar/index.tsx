import { faCog, faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMatch } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const WIDTH = `48px`;

const Container = styled.div`
  min-width: ${WIDTH};
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const BarContainer = styled.div`
  height: 100%;
  width: ${WIDTH};
  min-width: ${WIDTH};
  background-color: ${(props) => props.theme.color.sideBarBg};
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: ${(props) => props.theme.shadow.md};
`;

const MenuItem = styled.div<{ active?: boolean }>`
  color: ${(props) =>
    props.active ? props.theme.color.actionBg : props.theme.color.textLight};
  height: 28px;
  width: 28px;
  margin-top: ${(props) => props.theme.space.lg};
  padding: ${(props) => props.theme.space.md};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  background-color: transparent;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  transition: all 0.5s;
  font-size: 22px;
  :hover {
    box-shadow: ${(props) => props.theme.shadow.md};
  }
  :active {
    filter: brightness(1.3);
  }
`;

export const SideBar = () => {
  const match = useMatch('/:name/*');

  return (
    <Container>
      <BarContainer>
        <Link to="/stack">
          <MenuItem active={Boolean(match && match.params.name === 'stack')}>
            <FontAwesomeIcon icon={faHome} />
          </MenuItem>
        </Link>

        <Link to="/settings">
          <MenuItem active={Boolean(match && match.params.name === 'settings')}>
            <FontAwesomeIcon icon={faCog} />
          </MenuItem>
        </Link>
      </BarContainer>
    </Container>
  );
};
