import { useState } from 'react';
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

export const Select = ({ placeholder, value, options, onChange }) => {
  const [pushed, setPushed] = useState(false);
  return (
    <Pushable
      className="w-full"
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
          value={value}
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
