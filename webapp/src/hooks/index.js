import { API } from 'api';
import { useQuery } from 'react-query';
import { useCache } from 'state/lib';
import { useSubscribeRunnerAvailable } from './socket';

export * from './socket';
export * from './state';

export const useDirectory = (path = []) => {
  return useQuery(['directory', path.join('/')], ({ queryKey: [, pwd] }) => {
    return API.directory.subdirectories(pwd);
  });
};

export const useRunnerAvailalble = () => {
  const runnerAvailable = useCache('runner-available');
  useSubscribeRunnerAvailable();
  return runnerAvailable;
};
