import { StackList } from 'containers/stackList';
import { CommandList } from 'containers/commandList';
import { TopMessages } from 'containers/topMessages';

export const CommandView = () => {
  return (
    <div className="w-full">
      <TopMessages />

      <div className="p-6 w-full">
        <StackList />
        <CommandList />
      </div>
    </div>
  );
};
