import { Button } from '@chakra-ui/button';
import { Spinner } from '@chakra-ui/spinner';
import {
  faCog,
  faPause,
  faPlay,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { API } from 'api';
import classNames from 'classnames';
import { CommandForm } from 'containers/commandForm';
import { CommandFormatted } from 'containers/commandFormatted';
import { useCommands } from 'hooks';
import { map } from 'lodash';
import { useState } from 'react';

const CommandItem = ({ command }) => {
  return (
    <div
      className={classNames('container shadow p-3 rounded', {
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
                API.command.exec(command.name);
                //
              }}
            />
          )}
          {command.state === 'running' && (
            <FontAwesomeIcon
              className="text-white mr-3 cursor-pointer hover:text-red-500"
              icon={faPause}
              onClick={async () => {
                try {
                  await API.command.stop(command.name);
                } catch (err) {
                  //
                }
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
    </div>
  );
};

export const CommandList = () => {
  const [showCreate, setShowCreate] = useState(false);

  const { isLoading, data } = useCommands();

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
            onSubmit={async (values) => {
              console.log('aoeunt');
              try {
                await API.command.create(values);
                setShowCreate(true);
              } catch (err) {
                //
              }
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
