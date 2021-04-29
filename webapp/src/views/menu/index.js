import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { Button } from 'components/entry/button';

const Item = ({ path, children }) => {
  const loc = useLocation();
  const active = loc.pathname.startsWith(path);

  return (
    <Link to={path}>
      <Button
        className="mb-2"
        colorScheme={active ? 'pink' : 'default'}
        active={active}
      >
        {children}
      </Button>
    </Link>
  );
};

export const RootMenu = () => {
  return (
    <div className="shadow p-1.5" style={{ width: 55, height: '100%' }}>
      <Item path="/commands">
        <FontAwesomeIcon icon={faPlay} />
      </Item>
      <Item path="/templates">
        <FontAwesomeIcon icon={faList} />
      </Item>
    </div>
  );
};
