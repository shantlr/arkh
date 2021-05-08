import { API } from 'api';
import { useMutation, useQuery } from 'react-query';

export * from './socket';
export * from './state';

export const useExecCommand = () => {
  return useMutation((id) => API.command.exec(id), {});
};
export const useStopCommand = () => {
  return useMutation((id) => API.command.stop(id), {});
};

export const useDirectory = (path = []) => {
  return useQuery(['directory', path.join('/')], ({ queryKey: [, pwd] }) => {
    return API.directory.subdirectories(pwd);
  });
};
