import classNames from 'classnames';
import { useMemo, useState } from 'react';
import ReactSelect, { components } from 'react-select';
import { Pushable } from '../pushable';

import './style.css';

const SelectContainer = ({ children, ...props }) => {
  return (
    <div ref={props.selectProps.containerRef}>
      <components.SelectContainer {...props}>
        {children}
      </components.SelectContainer>
    </div>
  );
};
const Control = ({ children, ...props }) => {
  return (
    <components.Control
      className={props.selectProps.controlClassName}
      {...props}
    >
      {children}
    </components.Control>
  );
};

const ValueContainer = ({ children, ...props }) => (
  <components.ValueContainer
    className={props.selectProps.valueClassName}
    {...props}
  >
    {children}
  </components.ValueContainer>
);

export const Select = ({
  className,
  style,
  placeholder,
  value,
  options,
  onChange,
}) => {
  const [pushed, setPushed] = useState(false);

  const v = useMemo(() => {
    if (value === undefined || value === null) {
      return null;
    }
    if (options && Array.isArray(options)) {
      return options.filter((op) => op.value === value);
    }
    return null;
  }, [options, value]);

  return (
    <Pushable
      className={classNames('w-full', className)}
      style={style}
      colorScheme="gray"
      innerClassName="w-full"
      size="sm"
      pushed={pushed}
    >
      {(ref, innerClassName, contentClassName) => (
        <ReactSelect
          containerRef={ref}
          className={`metro-select`}
          classNamePrefix="react-select"
          controlClassName={innerClassName}
          valueClassName={contentClassName}
          value={v}
          placeholder={placeholder}
          onFocus={() => {
            setPushed(true);
          }}
          onMenuOpen={() => {
            setPushed(true);
          }}
          onBlur={() => {
            setPushed(false);
          }}
          onMenuClose={() => {
            setPushed(false);
          }}
          components={{ SelectContainer, Control, ValueContainer }}
          options={options}
          onChange={onChange}
        />
      )}
    </Pushable>
  );
};
