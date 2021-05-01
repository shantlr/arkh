import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDirectory } from 'hooks';
import { Select } from 'components/entry/select';
import { Button } from 'components/entry/button';

export const SelectDirectory = ({ prefix, initialPath }) => {
  const [currentPath, setPath] = useState(() => initialPath || []);

  const { data } = useDirectory(currentPath);

  return (
    <div>
      <div className="flex flex-wrap">
        <div>{(prefix || []).join(' > ')}</div>

        {currentPath.map((p, index) => (
          <div className="mb-0.5" key={p}>
            <Button
              size="sm"
              onClick={(e) => {
                setPath(currentPath.slice(0, index + 1));
              }}
            >
              {p}
            </Button>
          </div>
        ))}
      </div>
      <Select
        value={null}
        placeholder="Directory"
        options={
          data && data.directories
            ? data.directories.map((dir) => ({
                value: dir,
                label: dir,
              }))
            : []
        }
        onChange={(e) => {
          setPath([...currentPath, e.value]);
        }}
      />
    </div>
  );
};
SelectDirectory.propTypes = {
  prefix: PropTypes.arrayOf(PropTypes.string),
  initialPath: PropTypes.arrayOf(PropTypes.string),
};
SelectDirectory.defaultProps = {
  prefix: [],
  initialPath: [],
};
