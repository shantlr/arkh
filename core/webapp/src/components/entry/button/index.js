import PropTypes from 'prop-types';
import classNames from 'classnames';

import './index.css';
import { Pushable } from '../pushable';
import { useState } from 'react';

export const Button = ({
  type,
  size,
  className,
  onClick,
  colorScheme,
  children,
  active,
}) => {
  const [pushed, setPushed] = useState(false);

  return (
    <Pushable
      className={className}
      size={size}
      colorScheme={colorScheme}
      active={active}
      pushed={pushed}
    >
      {(ref, containerClassName, innerClassName) => (
        <button
          ref={ref}
          style={{ outline: 'none' }}
          type={type}
          className={classNames('metro-button', containerClassName)}
          onMouseDown={() => setPushed(true)}
          onMouseUp={() => setPushed(false)}
          onMouseLeave={() => setPushed(false)}
          onClick={onClick}
        >
          <div className={innerClassName}>{children}</div>
        </button>
      )}
    </Pushable>
  );
};
Button.propTypes = {
  size: PropTypes.oneOf(['default', 'sm']),
  colorScheme: PropTypes.oneOf(['gray', 'default', 'red', 'pink', 'yellow']),
};
Button.defaultProps = {
  type: 'button',
  colorScheme: 'default',
  size: 'default',
};
