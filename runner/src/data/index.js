import { nanoid } from 'nanoid';
import { spawn } from 'child_process';
import path from 'path';
import { debug } from '../debug';
import { getSocket } from '..';

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
export const getTask = (taskId) => {
  return TASKS[taskId];
};
export const startTask = (task) => {
  if (TASKS[task.id]) {
    debug(`task already started '${task.id}'`);
    return;
  }

  const cmd = getCommand(task.command_id);

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

  const taskState = {
    id: task.id,
    process: spawn(bin, args, {
      cwd: cmd.path && cmd.path.length > 0 ? path.resolve(cmd.path) : null,
    }),
    started_at: new Date(),
  };

  const socket = getSocket();

  socket.emit('task-started', {
    id: task.id,
    started_at: taskState.started_at,
  });
  debug(`start task '${task.id}' of command '${cmd.name}' (${cmd.id})`);

  taskState.process.stdout.on('data', (l) => {
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
  taskState.process.stderr.on('data', (l) => {
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

  taskState.process.on('close', (code, signal) => {
    debug(
      `end of task '${task.id}' of command '${cmd.name}' (${cmd.id}): ${code} (${signal})`
    );
    socket.emit(
      'task-stopped',
      {
        id: task.id,
        result: {
          code,
          signal,
        },
        ended_at: new Date(),
      },
      () => {
        // Clean when
        delete TASKS[task.id];
        debug(`task '${task.id}' cleaned`);
      }
    );
  });

  TASKS[task.id] = taskState;
};

export const stopTask = (task) => {
  const taskState = getTask(task.id);
  if (!taskState) {
    debug(`task '${task.id}' not started or already cleaned`);
    return;
  }

  taskState.process.kill('SIGTERM');
};
