import { Spinner } from '@chakra-ui/spinner';
import { useToast } from '@chakra-ui/toast';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/entry/button';
import { CommandForm } from 'containers/commandForm';
import { CommandItem } from 'containers/commandItem';
import { useCommands, useCreateCommand } from 'hooks';
import { map } from 'lodash';
import { useState } from 'react';

export const CommandList = () => {
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();

  const { isLoading, data } = useCommands();
  const [createCommand] = useCreateCommand();

  return (
    <div className="h-full w-full overflow-auto">
      <div className="mb-3 flex items-center">
        Commands
        <Button
          className="ml-3"
          size="sm"
          onClick={() => {
            setShowCreate(true);
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
      {showCreate && (
        <div className="mb-3">
          <CommandForm
            onCancel={() => setShowCreate(false)}
            onSubmit={(values) => {
              createCommand(values, {
                onSuccess: () => setShowCreate(false),
                onError: (err) => {
                  toast({
                    status: 'error',
                    position: 'top-right',
                    title: `Could not create command`,
                    description: err.message,
                    isClosable: true,
                  });
                },
              });
            }}
          />
        </div>
      )}

      {isLoading && (
        <div>
          <Spinner />
        </div>
      )}
      {map(data, (command) => (
        <CommandItem key={command.id} commandId={command.id} />
      ))}
    </div>
  );
};
