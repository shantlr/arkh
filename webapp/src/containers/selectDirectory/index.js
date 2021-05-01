import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDirectory } from 'hooks';
import { Button } from 'components/entry/button';
import { Spinner } from '@chakra-ui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { map } from 'lodash-es';
import classNames from 'classnames';

const DirectoryList = ({ path, showSeparator, onSelect }) => {
  const { data, isLoading } = useDirectory(path);

  if (!data || isLoading) {
    return <Spinner />;
  }
  return (
    <div
      style={{ maxHeight: 300, minWidth: 100 }}
      className={classNames('p-1 overflow-auto', {
        'border-l-blue-200 border-l-2': showSeparator,
      })}
    >
      {data.directories.map((dir) => (
        <div
          key={dir}
          className="cursor-pointer hover:bg-blue-400 hover:text-white p-1 text-sm rounded"
          onClick={() => {
            onSelect(dir);
          }}
        >
          {dir}
        </div>
      ))}
    </div>
  );
};

export const SelectDirectory = ({
  placeholder,
  size,
  prefix,
  initialPath,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  if ((!value || !value.length) && !open) {
    return (
      <Button colorScheme="gray" onClick={() => setOpen(true)}>
        {placeholder}
      </Button>
    );
  }

  return (
    <div>
      <div className="flex mb-1">
        {map(value, (dir, index) => (
          <Button key={index} size="sm">
            {dir}
          </Button>
        ))}
        <Button className="ml-0.5" size="sm" onClick={() => setOpen(!open)}>
          <div
            className={classNames('transition-all', {
              'transform rotate-180': open,
            })}
          >
            <FontAwesomeIcon icon={faCaretUp} />
          </div>
        </Button>
      </div>
      {open && (
        <div className="flex">
          <DirectoryList
            path={[]}
            onSelect={(dir) => {
              onChange([dir]);
            }}
          />
          {map(value, (dir, index) => (
            <DirectoryList
              key={index}
              showSeparator
              path={value.slice(0, index + 1)}
              onSelect={(newDir) => {
                onChange([...value.slice(0, index + 1), newDir]);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
SelectDirectory.propTypes = {
  placeholder: PropTypes.string,
  prefix: PropTypes.arrayOf(PropTypes.string),
  initialPath: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
};
SelectDirectory.defaultProps = {
  placeholder: 'Select directory',
  prefix: [],
  initialPath: [],
};
