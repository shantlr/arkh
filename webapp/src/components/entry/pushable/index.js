import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import './style.css';

export const Pushable = ({
  className,
  style,
  innerClassName,
  colorScheme,
  size,
  children,
  active,
  pushed,
  onClick,
}) => {
  const ref = useRef();
  const [height, setHeight] = useState(null);

  useEffect(() => {
    if (ref.current && ref.current.offsetHeight) {
      setHeight(ref.current.offsetHeight);
    }
  }, []);

  const containerHeight = height !== null ? height + 12 : null;

  return (
    <div
      className={classNames(className, 'inline-flex items-end')}
      style={{
        maxHeight: containerHeight,
        height: containerHeight,
        ...(style || null),
      }}
    >
      <div
        className={classNames(
          innerClassName,
          `metro-pushable metro-pushable-color-${colorScheme}`,
          active ? 'metro-pushable-active' : null,
          pushed ? 'metro-pushable-pushed' : 'metro-pushable-not-pushed',
          `metro-pushable-size-${size}`
        )}
        onClick={onClick}
      >
        {children(ref, `metro-pushable-inner`, `metro-pushable-content`)}
        <div className="metro-pushable-bottom" />
      </div>
    </div>
  );
};
Pushable.propTypes = {
  className: PropTypes.string,
  colorScheme: PropTypes.oneOf(['default', 'gray', 'red', 'pink', 'none']),
  size: PropTypes.oneOf(['sm', 'default']),
  active: PropTypes.bool,
  pushed: PropTypes.bool,
};
Pushable.defaultProps = {
  colorScheme: 'default',
  size: 'default',
};
