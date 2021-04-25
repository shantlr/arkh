import { CommandGroupList } from 'containers/commandGroupList';
import { CommandList } from 'containers/commandList';

export const CommandView = () => {
  return (
    <div className="p-6 w-full">
      <CommandGroupList />
      <CommandList />
    </div>
  );
};
