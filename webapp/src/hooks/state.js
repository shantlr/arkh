import { API } from 'api';
import { useMutation, useQuery } from 'state/lib';

export const useTemplates = () => {
  return useQuery({
    key: 'templates',
  });
};

export const useCreateTemplate = () => {
  return useMutation(
    (p, template) => ['template', template.id],
    (template) => API.template.create(template),
    {
      onSuccess: ({ dataCache }) => {
        dataCache.invalidateQuery('templates');
      },
    }
  );
};
export const useUpdateTemplate = () => {
  return useMutation(
    ({ id }) => ['template', id],
    ({ id, template }) => API.template.update(id, template)
  );
};

export const useCommand = (id) => {
  const res = useQuery({
    key: 'command',
    params: id,
    cache: {
      key: 'command',
      params: id,
    },
  });

  return res;
};
export const useCommands = () => {
  return useQuery({
    key: 'commands',
  });
};
export const useCreateCommand = () => {
  return useMutation(
    (p, cmd) => ['command', cmd.id],
    (command) => API.command.create(command),
    {
      onSuccess: ({ dataCache }) => {
        dataCache.invalidateQuery('commands');
      },
    }
  );
};
export const useUpdateCommand = () => {
  return useMutation(
    ({ id }) => ['command', id],
    ({ id, command }) => API.command.update(id, command)
  );
};
