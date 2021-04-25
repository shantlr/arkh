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
          'flex justify-center items-center cursor-pointer mb-1 rounded p-0.5 transition-all',
          'hover:bg-blue-300',
          {
            'pb-2 bg-blue-400': active,
            'hover:pb-1.5 bg-blue-200': !active,
          }
        )}
      >
        <div className="p-2 bg-white rounded w-full flex justify-center items-center">
          {children}
        </div>
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
