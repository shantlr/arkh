import { StackList } from 'containers/stackList';
import { CommandList } from 'containers/commandList';

export const CommandView = () => {
  return (
    <div className="p-6 w-full">
      <StackList />
      <CommandList />
    </div>
  );
};
