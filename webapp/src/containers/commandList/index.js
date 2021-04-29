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
import { Button } from 'components/entry/button';
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

  return (
    <table
      className="bg-black text-sm overflow-auto p-1 w-full"
      style={{ maxHeight: 400 }}
    >
      <tbody>
        {map(logs, (log) => (
          <tr key={log.offset}>
            <td
              className="text-gray-400 select-none text-right"
              style={{ minWidth: 40 }}
            >
              {log.offset} |
            </td>
            <td>
              <span className="text-purple-600">{log.date}</span>{' '}
              <span className="text-gray-300 whitespace-pre-wrap">
                {log.msg}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const CommandItem = ({ command }) => {
  const toast = useToast();
  const exec = useExecCommand();
  const stop = useStopCommand();

  return (
    <div
      className={classNames(
        'mb-3 container shadow p-3 rounded transition-all',
        {
          'bg-green-400 text-white': command.state === 'running',
        }
      )}
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
                exec.mutate(command.name, {
                  onError: (err) => {
                    toast({
                      position: 'top-right',
                      title: `Could not exec '${command.name}'`,
                      description: err.message,
                      status: 'error',
                      isClosable: true,
                    });
                  },
                });
              }}
            />
          )}
          {command.state === 'running' && (
            <FontAwesomeIcon
              className="text-white mr-3 cursor-pointer hover:text-red-500"
              icon={faPause}
              onClick={() => {
                stop.mutate(command.name, {
                  onError: (err) => {
                    toast({
                      position: 'top-right',
                      title: `Could not stop '${command.name}'`,
                      description: err.message,
                      status: 'error',
                      isClosable: true,
                    });
                  },
                });
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
