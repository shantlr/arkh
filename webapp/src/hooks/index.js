import { API } from 'api';
import { useQuery } from 'react-query';

export const useCommands = () => useQuery('commands', () => API.command.list());

export const useTemplates = () =>
  useQuery('templates', () => {
    return API.template.list();
  });
