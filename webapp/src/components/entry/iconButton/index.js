import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

export const IconButton = ({
  className,
  icon,
  onClick,
  disabled,
  children,
}) => {
  return (
    <button
      className={classNames(
        'cursor',
        {
          'text-gray-600 hover:text-blue-600': !disabled,
          'text-gray-300 ': disabled,
        },
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {Boolean(icon) && <FontAwesomeIcon icon={icon} />}
      {children}
    </button>
  );
};
