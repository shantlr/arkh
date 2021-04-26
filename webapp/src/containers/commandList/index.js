import { Button } from '@chakra-ui/button';
import { Spinner } from '@chakra-ui/spinner';
import { useToast } from '@chakra-ui/toast';
import {
  faCog,
  faPause,
  faPlay,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { CommandForm } from 'containers/commandForm';
import { CommandFormatted } from 'containers/commandFormatted';
import {
  useCommandLogs,
  useCommands,
  useCreateCommand,
  useExecCommand,
  useStopCommand,
} from 'hooks';
import { map } from 'lodash';
import { useState } from 'react';

const CommandLogs = ({ command }) => {
  const logs = useCommandLogs(command.name);

  console.log('logs', logs);
  return (
    <div
      className="bg-black text-sm overflow-auto p-1"
      style={{ maxHeight: 400 }}
    >
      {map(logs, (log, idx) => (
        <div key={idx}>
          <span className="text-yellow-500" style={{ minWidth: 30 }}>
            {idx} |
          </span>
          <span className="text-gray-400">{log.date}</span>{' '}
          <span className="">{log.msg}</span>
        </div>
      ))}
    </div>
  );
};

const CommandItem = ({ command }) => {
  const exec = useExecCommand();
  const stop = useStopCommand();

  return (
    <div
      className={classNames('container shadow p-3 rounded transition-all', {
        'bg-green-400 text-white': command.state === 'running',
      })}
    >
      <div className="flex justify-between">
        <div>
          {command.name}
          <CommandFormatted
            className="ml-3 text-sm text-gray-400"
            template={command.template}
            params={command.params}
          />
        </div>
        <div>
          {command.state === 'stopped' && (
            <FontAwesomeIcon
              className={classNames(
                'mr-3 cursor-pointer',
                'text-gray-600 hover:text-blue-600'
              )}
              icon={faPlay}
              onClick={() => {
                exec.mutate(command.name);
              }}
            />
          )}
          {command.state === 'running' && (
            <FontAwesomeIcon
              className="text-white mr-3 cursor-pointer hover:text-red-500"
              icon={faPause}
              onClick={() => {
                stop.mutate(command.name);
              }}
            />
          )}
          <FontAwesomeIcon
            className="cursor-pointer text-gray-600 hover:text-blue-600"
            icon={faCog}
            onClick={() => {
              //
            }}
          />
        </div>
      </div>
      {command.state === 'running' && <CommandLogs command={command} />}
    </div>
  );
};

export const CommandList = () => {
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();

  const { isLoading, data } = useCommands();
  const createCommand = useCreateCommand();

  return (
    <div>
      <div className="mb-3">
        Commands
        <Button
          className="ml-3"
          colorScheme="blue"
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
              createCommand.mutate(values, {
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
        <CommandItem key={command.name} command={command} />
      ))}
    </div>
  );
};
