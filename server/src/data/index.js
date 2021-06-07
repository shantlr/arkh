import Knex from 'knex';
import { keyBy } from 'lodash';
import { config } from '../config';

export const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: config.get('sqlite.file'),
  },
});

export const NAME_REGEX = /[a-z0-9-]+/i;

const parseCommand = (cmd) => {
  if (!cmd) {
    return null;
  }
  const config = JSON.parse(cmd.config);
  delete cmd.config;

  cmd.params = config.params;
  cmd.path = config.path;

  return cmd;
};
export const Command = (t = knex) => t('commands');
Command.getAll = async ({ withTemplate = false } = {}) => {
  const cmds = await Command()
    .select()
    .then((r) => r.map(parseCommand));
  if (withTemplate) {
    const templates = await CommandTemplate.getByIds(
      cmds.map((c) => c.template_id)
    ).then((r) => keyBy(r, 'id'));
    cmds.forEach((cmd) => {
      cmd.template = templates[cmd.template_id];
    });
  }
  return cmds;
};
Command.getById = async (id, { withTemplate = false } = {}) => {
  const cmd = await Command()
    .select()
    .first()
    .where({
      id,
    })
    .then(parseCommand);

  if (!cmd) {
    return null;
  }

  if (withTemplate) {
    cmd.template = await CommandTemplate.getById(cmd.template_id);
  }

  return cmd;
};

export const parseTemplate = (template) => {
  if (!template) {
    return null;
  }
  const config = JSON.parse(template.config);
  delete template.config;

  template.bin = config.bin;
  template.args = config.args;
  template.path = config.path;

  return template;
};
export const CommandTemplate = (t = knex) => t('command_templates');
CommandTemplate.getAll = () =>
  CommandTemplate()
    .select()
    .then((r) => r.map(parseTemplate));
CommandTemplate.getByIds = (ids) =>
  CommandTemplate()
    .select()
    .whereIn('id', ids)
    .then((r) => r.map(parseTemplate));
CommandTemplate.getById = (id) =>
  CommandTemplate()
    .select()
    .first()
    .where({
      id,
    })
    .then(parseTemplate);
CommandTemplate.getByName = (name) =>
  CommandTemplate()
    .select()
    .first()
    .where({
      name,
    })
    .then(parseTemplate);

const parseTask = (task) => {
  if (task) {
    if (task.result) {
      task.result = JSON.parse(task.result);
    }
  }
  return task;
};
export const Task = (t = knex) => t('tasks');
Task.getById = (id) =>
  Task()
    .select()
    .first()
    .where({
      id,
    })
    .then(parseTask);

Task.ofCommand = (commandId) =>
  Task()
    .select()
    .where({
      command_id: commandId,
    })
    .orderBy('ended_at', 'desc')
    .then((r) => r.map(parseTask));
Task.activeOf = (commandId) =>
  Task()
    .select()
    .where({
      command_id: commandId,
      ended_at: null,
    })
    .then((r) => r.map(parseTask));

export const TaskLog = (t = knex) => t('task_logs');
TaskLog.getById = (id) =>
  TaskLog().select().first().where({
    id,
  });
TaskLog.ofTask = (taskId) =>
  TaskLog().select().where({
    task_id: taskId,
  });
