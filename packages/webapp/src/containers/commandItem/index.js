import { Spinner } from '@chakra-ui/spinner';
import { useToast } from '@chakra-ui/toast';
import { faCog, faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

import { Card } from 'components/display/card';
import { IconButton } from 'components/entry/iconButton';
import { CommandForm } from 'containers/commandForm';
import { CommandFormatted } from 'containers/commandFormatted';
import {
  useCommand,
  useExecCommand,
  useRunnerAvailable,
  useStopCommand,
  useSubscribeCommandTask,
  useUpdateCommand,
} from 'hooks';
import { useState } from 'react';
import { CommandLastTask } from './commandLastTask';

// const CommandLogs = ({ command }) => {
//   const logs = useCommandLogs(command.id);

//   return (
//     <table
//       className="bg-black text-sm overflow-auto p-1 w-full"
//       style={{ maxHeight: 400 }}
//     >
//       <tbody>
//         {map(logs, (log) => (
//           <tr key={log.offset}>
//             <td
//               className="text-gray-400 select-none text-right"
//               style={{ minWidth: 40 }}
//             >
//               {log.offset} |
//             </td>
//             <td>
//               <span className="text-purple-600">{log.date}</span>{' '}
//               <span className="text-gray-300 whitespace-pre-wrap">
//                 {log.msg}
//               </span>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

export const CommandItem = ({ commandId, selected, onClick }) => {
  const { isLoading, data: command } = useCommand(commandId);

  const runnerAvailable = useRunnerAvailable();
  useSubscribeCommandTask(commandId);

  const toast = useToast();
  const [exec] = useExecCommand();
  const [stop] = useStopCommand();
  const [update] = useUpdateCommand();

  const [edit, setEdit] = useState(false);

  if (isLoading || !command) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  return (
    <Card
      colorScheme={selected ? 'green' : 'default'}
      className="cursor-pointer"
      onClick={onClick}
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
          {/* {command.state === 'stopped' && ( */}
          <IconButton
            icon={faPlay}
            disabled={!runnerAvailable}
            className="mr-3"
            onClick={(e) => {
              e.stopPropagation();
              exec(command.id, {
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
          {/* )} */}
          {/* {command.state === 'running' && (
            <FontAwesomeIcon
              className="mr-3 cursor-pointer hover:text-red-500"
              icon={faPause}
              onClick={() => {
                stop(command.id, {
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
          )} */}
          <FontAwesomeIcon
            className={classNames(
              command.state !== 'running'
                ? 'cursor-pointer text-gray-600 hover:text-blue-600'
                : 'text-gray-200'
            )}
            icon={faCog}
            onClick={(e) => {
              if (command.state === 'running') {
                return;
              }
              setEdit(!edit);
            }}
          />
        </div>
      </div>

      {edit && (
        <CommandForm
          submitText="Update"
          initialValues={{
            ...command,
            template: command.template.name,
          }}
          onCancel={() => {
            setEdit(false);
          }}
          onSubmit={(values) => {
            update(
              { id: command.id, command: values },
              {
                onSuccess: () => {
                  setEdit(false);
                },
                onError: (err) => {
                  toast({
                    status: 'error',
                    position: 'top-right',
                    title: 'Could not update command',
                    description: err.message,
                    isClosable: true,
                  });
                },
              }
            );
          }}
        />
      )}

      <CommandLastTask className="mt-1" commandId={commandId} />
    </Card>
  );
};
