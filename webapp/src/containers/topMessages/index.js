import {
  faBan,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSocketIsConnected } from 'containers/socket';
import { useRunnerAvailable } from 'hooks';

export const TopMessages = () => {
  const runnerAvailable = useRunnerAvailable();
  const isSocketConnected = useSocketIsConnected();

  return (
    <div>
      {isSocketConnected === false && (
        <div className="bg-red-500 text-white p-2 text-sm">
          <FontAwesomeIcon className="mr-1" icon={faBan} />
          Not connected to server
        </div>
      )}
      {runnerAvailable === false && (
        <div className="bg-red-500 text-white p-2 text-sm">
          <FontAwesomeIcon className="mr-1" icon={faExclamationTriangle} />
          No runner available. Start runner with{' '}
          <code className="bg-gray-600 rounded p-1">npx metro-runner</code>
        </div>
      )}
    </div>
  );
};
