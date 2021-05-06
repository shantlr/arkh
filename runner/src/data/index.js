import { nanoid } from 'nanoid';
import { spawn } from 'child_process';
import path from 'path';
import { debug } from '../debug';

const COMMANDS = {};

export const getCommand = (id) => {
  return COMMANDS[id] || null;
};
export const setCommand = (cmd) => {
  COMMANDS[cmd.id] = cmd;
  return cmd;
};
export const deleteCommand = (cmdId) => {
  delete COMMANDS[cmdId];
};

const TASKS = {};
export const getTask = (cmdId) => {
  return TASKS[cmdId];
};
export const startTask = ({ socket, cmd }) => {
  if (TASKS[cmd.id]) {
    throw new Error(
      `Task already existing for command ${cmd.name} (${cmd.id})`
    );
  }

  const bin = cmd.template.bin;
  const args = cmd.template.args.map((arg) => {
    if (arg.type === 'static') {
      return arg.value;
    }
    if (arg.type === 'variable') {
      return cmd.params[arg.name];
    }
    return null;
  });

  const task = {
    id: nanoid(),
    process: spawn(bin, args, {
      cwd: cmd.path && cmd.path.length > 0 ? path.resolve(cmd.path) : null,
    }),
  };

  socket.emit('task-started', {
    id: task.id,
    command_id: cmd.id,
    date: new Date(),
  });
  debug(`start task '${task.id}' of command '${cmd.name}' (${cmd.id})`);

  task.process.stdout.on('data', (l) => {
    const log = {
      id: nanoid(),
      task_id: task.id,
      level: 30,
      date: new Date(),
      msg: l.toString(),
    };
    socket.emit('task-log', {
      id: task.id,
      log,
    });
  });
  task.process.stderr.on('data', (l) => {
    const log = {
      id: nanoid(),
      task_id: task.id,
      level: 50,
      date: new Date(),
      msg: l.toString(),
    };
    socket.emit('task-log', {
      id: task.id,
      log,
    });
  });
  task.process.on('close', (code, signal) => {
    debug(
      `end of task '${task.id}' of command '${cmd.name}' (${cmd.id}): ${code} (${signal})`
    );
    delete TASKS[cmd.id];
    socket.emit('task-stopped', {
      id: task.id,
      result: {
        code,
        signal,
      },
      date: new Date(),
    });
  });

  TASKS[cmd.id] = task;
};
