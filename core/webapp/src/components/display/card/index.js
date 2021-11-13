import classNames from 'classnames';
import PropTypes from 'prop-types';

const colorSchemes = {
  default: 'border-gray-200',
  green: 'border-green-400',
};
const colorSchemesHover = {
  default: 'hover:border-gray-300',
  green: 'hover:border-green-500',
};

export const Card = ({ colorScheme, className, hover, children, onClick }) => {
  return (
    <div
      className={classNames(
        'mb-3 border-2 border-b-4 rounded shadow transition-all',
        colorSchemes[colorScheme],
        Boolean(onClick) ? colorSchemesHover[colorScheme] : null,
        className
      )}
      onClick={onClick}
    >
      <div className="bg-white p-2 rounded">{children}</div>
    </div>
  );
};
Card.propTypes = {
  colorScheme: PropTypes.oneOf(['green', 'default']),
};
Card.defaultProps = {
  colorScheme: 'default',
};
