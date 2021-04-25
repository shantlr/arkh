import { API } from 'api';
import { useMutation, useQuery, useQueryClient } from 'react-query';

export const useCommands = () => useQuery('commands', () => API.command.list());

export const useTemplates = () =>
  useQuery('templates', () => {
    return API.template.list();
  });

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

  return useMutation(
    ({ name, template }) => API.template.update(name, template),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
      },
    }
  );
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
  return useMutation(({ name, command }) => API.command.update(name, command), {
    onSuccess: () => {
      queryClient.invalidateQueries('commands');
    },
  });
};

export const useExecCommand = () => {
  const queryClient = useQueryClient();
  return useMutation((name) => API.command.exec(name), {
    onSuccess: () => {
      queryClient.invalidateQueries('commands');
    },
  });
};
export const useStopCommand = () => {
  const queryClient = useQueryClient();
  return useMutation((name) => API.command.stop(name), {
    onSuccess: () => {
      queryClient.invalidateQueries('commands');
    },
  });
};
