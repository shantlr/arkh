import { API } from 'api';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useSubscribeCommandState } from './socket';

export * from './socket';
export * from './state';

export const useCommands = () => useQuery('commands', () => API.command.list());

export const useCommand = (id) => {
  const res = useQuery(['command', id], () => API.command.get(id));
  useSubscribeCommandState(id);

  return res;
};

// export const useTemplates = () =>
//   useQuery('templates', () => {
//     return API.template.list();
//   });

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation((template) => API.template.create(template), {
    onSuccess: () => {
      queryClient.invalidateQueries('templates');
    },
  });
};
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation(({ id, template }) => API.template.update(id, template), {
    onSuccess: () => {
      queryClient.invalidateQueries('templates');
    },
  });
};

export const useCreateCommand = () => {
  const queryClient = useQueryClient();

  return useMutation((command) => API.command.create(command), {
    onSuccess: () => {
      queryClient.invalidateQueries('commands');
    },
  });
};

export const useUpdateCommand = () => {
  const queryClient = useQueryClient();
  return useMutation(({ id, command }) => API.command.update(id, command), {
    onSuccess: (r, { id }) => {
      queryClient.invalidateQueries(['command', id]);
    },
  });
};

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
