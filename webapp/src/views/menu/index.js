import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import classnames from 'classnames';
import { Link } from 'react-router-dom';

const Item = ({ path, children }) => {
  const loc = useLocation();
  const active = loc.pathname.startsWith(path);

  return (
    <Link to={path}>
      <div
        className={classnames(
          'flex p-2 justify-center align-items-center cursor-pointer border-2 rounded border-b-8 mb-1',
          {
            'border-blue-300 hover:border-blue-600': !active,
            'border-yellow-500 hover:border-yellow-700': active,
          }
        )}
      >
        {children}
      </div>
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
