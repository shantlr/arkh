import classNames from 'classnames';

export const Card = ({ className, children, onClick }) => {
  return (
    <div
      className={classNames(
        'p-2 mb-3 border-gray-200 border-2 border-b-4 rounded shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
