import { API } from 'api';
import { useCacheValue, useMutation, useQuery } from 'lib/cache';

export const useTemplates = () => {
  return useQuery({
    key: 'templates',
  });
};
export const useTemplate = (templateId) => {
  return useQuery({
    key: 'template',
    params: templateId,
    withMappedData: true,
    withOptimistic: true,
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

export const useCommand = (id) =>
  useQuery({
    key: 'command',
    params: id,
    withMappedData: true,
    withOptimistic: true,
  });

export const useRecentTask = (commandId) => {
  return useCacheValue('command-tasks', commandId);
};

export const useCommands = () =>
  useQuery({
    key: 'commands',
  });
export const useCreateCommand = () =>
  useMutation(
    (p, cmd) => ['command', cmd.id],
    (command) => API.command.create(command),
    {
      onSuccess: ({ dataCache }) => {
        dataCache.invalidateQuery('commands');
      },
    }
  );
export const useUpdateCommand = () =>
  useMutation(
    ({ id }) => ['command', id],
    ({ id, command }) => API.command.update(id, command)
  );
export const useExecCommand = () =>
  useMutation(null, (id) => API.command.exec(id));
export const useStopCommand = () =>
  useMutation(null, (id) => API.command.stop(id), {});

export const useRunners = () => {
  return useQuery({
    key: 'runners',
  });
};
