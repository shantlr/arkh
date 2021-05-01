import classNames from 'classnames';

export const Input = ({ className, placeholder, value, onChange }) => {
  return (
    <input
      className={classNames(
        'p-2 border-b-2 border-gray-300 hover:border-gray-400 focus:border-gray-500 transition-all',
        'focus:border-blue-400',
        className
      )}
      style={{ outline: 'none' }}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};
