import { StackList } from 'containers/stackList';
import { CommandList } from 'containers/commandList';
import { TopMessages } from 'containers/topMessages';
import { useHistory, useRouteMatch } from 'react-router';
import { CommandDetails } from 'containers/commandDetails';

export const CommandView = () => {
  const history = useHistory();
  const match = useRouteMatch('/commands/:commandId');

  return (
    <div className="w-full h-full">
      <TopMessages />

      <div className="w-full h-full flex">
        <div className="p-6 w-full">
          <StackList />
          <CommandList
            selectedCommandId={match ? match.params.commandId : null}
            onSelect={(commandId) => {
              if (match && match.params.commandId === commandId) {
                history.replace(`/commands`);
              } else {
                history.replace(`/commands/${commandId}`);
              }
            }}
          />
        </div>
        {Boolean(match) && (
          <CommandDetails commandId={match.params.commandId} />
        )}
      </div>
    </div>
  );
};
