import PropTypes from 'prop-types';
import classNames from 'classnames';

import './index.css';

const colorSchemes = {
  default:
    'border-blue-400 bg-blue-400 text-blue-400 hover:border-blue-600 hover:text-blue-600',
  pink:
    'border-pink-400 bg-pink-400 text-pink-400 hover:border-pink-600 hover:text-pink-600',
  red:
    'border-red-400 bg-red-400 text-red-400 hover:border-red-600 hover:text-red-600',
  gray:
    'border-gray-400 bg-gray-400 text-gray-400 hover:border-gray-700 hover:text-gray-700',
  yellow:
    'border-yellow-400 bg-yellow-400 text-yellow-400 hover:border-yellow-700 hover:text-yellow-700',
};
const sizes = {
  sm: 'text-xs py-1 px-2.5',
  default: 'text-sm font-bold py-1.5 px-3',
};

const containerSizes = {
  default: 'metro-button-size-default',
  sm: 'metro-button-size-sm',
};

export const Button = ({
  type,
  size,
  className,
  onClick,
  colorScheme,
  children,
  active,
}) => {
  return (
    <div
      className={classNames(
        'metro-button-container inline-flex items-end transition-all',
        className,
        containerSizes[size],
        {
          'metro-button-container-active': active,
        }
      )}
    >
      <button
        className={classNames(
          colorSchemes[colorScheme],
          'flex rounded border-2 border-b-8 transition-all'
        )}
        style={{ outline: 'none' }}
        type={type}
        onClick={onClick}
      >
        <div className={classNames('rounded bg-white', sizes[size])}>
          {children}
        </div>
      </button>
    </div>
  );
};
Button.propTypes = {
  size: PropTypes.oneOf(['default', 'sm']),
  colorScheme: PropTypes.oneOf(['gray', 'default', 'red', 'pink', 'yellow']),
};
Button.defaultProps = {
  colorScheme: 'default',
  size: 'default',
};
