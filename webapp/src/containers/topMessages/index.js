import { useRunnerAvailable } from 'hooks';

export const TopMessages = () => {
  const runnerAvailable = useRunnerAvailable();

  return (
    <div>
      {runnerAvailable === false && (
        <div className="bg-red-500 text-white p-2 text-sm">
          No runner available. Start runner with{' '}
          <code className="bg-gray-600 rounded p-1">npx metro-runner</code>
        </div>
      )}
    </div>
  );
};
