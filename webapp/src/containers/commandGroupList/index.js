import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/entry/button';

export const CommandGroupList = () => {
  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center">
        Groups
        <Button size="sm" className="ml-3">
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
    </div>
  );
};
