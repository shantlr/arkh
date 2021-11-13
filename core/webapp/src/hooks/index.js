import { API } from 'api';
import { useCacheValue } from 'lib/cache';
import { useQuery } from 'react-query';
import { useSubscribeRunnerAvailable } from './socket';

export * from './socket';
export * from './state';

export const useDirectory = (path = []) => {
  return useQuery(['directory', path.join('/')], ({ queryKey: [, pwd] }) => {
    return API.directory.subdirectories(pwd);
  });
};

export const useRunnerAvailable = () => {
  const runnerAvailable = useCacheValue('runner-available');
  useSubscribeRunnerAvailable();
  return runnerAvailable;
};
