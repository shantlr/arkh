import { Button } from '@chakra-ui/button';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const CommandGroupList = () => {
  return (
    <div className="mb-5">
      <div>
        Groups
        <Button colorScheme="blue" size="sm" className="ml-3">
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
    </div>
  );
};
