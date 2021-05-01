import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { sortBy } from 'lodash';
import childProcess from 'child_process';
import { Server } from 'socket.io';

import { config } from './config';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket',
  cors: {
    origin: '*',
  },
});

app.use(cors(), bodyParser.json());

app.get('/', (req, res) => {
  res.redirect('/app');
});

const NAME_REGEX = /[a-z0-9-]+/i;

const getTemplate = async (name) => {
  try {
    const buf = await fs.promises.readFile(
      path.resolve(config.get('template.directory'), `${name}.yml`)
    );
    return YAML.parse(buf.toString());
  } catch (err) {
    return null;
  }
};

const getCommand = async (name) => {
  try {
    const buf = await fs.promises.readFile(
      path.resolve(config.get('command.directory'), `${name}.yml`)
    );
    const cmd = YAML.parse(buf.toString());
    cmd.template = await getTemplate(cmd.template);
    return cmd;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const COMMANDS = {};

const mapCommand = (cmd) => {
  return {
    bin: cmd.template.bin,
    args: cmd.template.args.map((arg) => {
      if (arg.type === 'static') {
        return arg.value;
      }
      if (arg.type === 'variable') {
        return cmd.params[arg.name];
      }
      return null;
    }),
  };
};

app.post('/api/commands/create', async (req, res) => {
  const { name, template: templateName, params } = req.body;
  if (!NAME_REGEX.test(name)) {
    return res.status(422).send('Invalid name');
  }
  const template = await getTemplate(templateName);
  if (!template) {
    return res.status(422).send('Invalid template');
  }

  const p = path.resolve(config.get('command.directory'), `${name}.yml`);
  try {
    await fs.promises.access(p, fs.constants.F_OK);
    return res.status(422).send('Name already used');
  } catch {
    //
  }

  await fs.promises.writeFile(
    p,
    YAML.stringify({
      name,
      template: templateName,
      params,
    })
  );
  return res.status(200).send(true);
});
app.post('/api/commands/:name/update', async (req, res) => {
  const { name: orginalName } = req.params;
  const { name, template: templateName, path: pwd, params } = req.body;

  if (!NAME_REGEX.test(orginalName) || !NAME_REGEX.test(name)) {
    return res.status(422).send('Invalid name');
  }

  const command = await getCommand(orginalName);
  if (!command) {
    return res.status(422).send('Invalid command');
  }

  const template = await getTemplate(templateName);
  if (!template) {
    return res.status(422).send('Invalid template');
  }

  const p = path.resolve(config.get('command.directory'), `${name}.yml`);
  if (orginalName !== name) {
    try {
      await fs.promises.access(p, fs.constants.F_OK);
      return res.status(422).send('Name already used');
    } catch {
      //
    }
    await fs.promises.unlink(
      path.resolve(config.get('command.directory'), `${orginalName}.yml`)
    );
  }

  await fs.promises.writeFile(
    p,
    YAML.stringify({
      name,
      template: templateName,
      params,
    })
  );
  return res.status(200).send(true);
});

app.post('/api/commands/:name/exec', async (req, res) => {
  const { name } = req.params;

  if (!NAME_REGEX.test(name)) {
    return res.status(422).send('Invalid name');
  }

  if (COMMANDS[name]) {
    return res.status(422).send('Execution ongoing');
  }
  const cmd = await getCommand(name);

  const { bin, args } = mapCommand(cmd);

  COMMANDS[name] = {
    process: childProcess.spawn(bin, args, {}),
    logs: [],
    offset: 0,
  };
  COMMANDS[name].process.stdout.on('data', (data) => {
    COMMANDS[name].offset += 1;
    const log = {
      offset: COMMANDS[name].offset,
      date: new Date(),
      msg: data.toString(),
    };
    COMMANDS[name].logs.push(log);
    io.in(`command-logs:${name}`).emit(`command-logs:${name}`, [log]);
  });
  COMMANDS[name].process.stderr.on('data', (data) => {
    COMMANDS[name].offset += 1;
    const log = {
      offset: COMMANDS[name].offset,
      date: new Date(),
      msg: data.toString(),
    };
    COMMANDS[name].logs.push(log);
    io.in(`command-logs:${name}`).emit(`command-logs:${name}`, [log]);
  });
  console.log(`cmd ${name} started`);
  return res.status(200).send('');
});
app.post('/api/commands/:name/stop', async (req, res) => {
  const { name } = req.params;

  if (!NAME_REGEX.test(name)) {
    return res.status(422).send('Invalid name');
  }
  if (!COMMANDS[name]) {
    return res.status(422).send('Not running');
  }

  if (COMMANDS[name].process.exitCode !== null) {
    // already exited
    delete COMMANDS[name];
    return res.status(200).send();
  }

  const r = COMMANDS[name].process.kill();
  if (r === true) {
    delete COMMANDS[name];
    console.log(`cmd ${name} stopped`);
    return res.status(200).send();
  }

  return res.status(422).send();
});

app.get('/api/commands', async (req, res) => {
  const files = await fs.promises.readdir(
    path.resolve(config.get('command.directory'))
  );

  const commands = [];
  await Promise.all(
    files.map(async (f) => {
      const p = path.resolve(config.get('command.directory'), f);
      try {
        const buf = await fs.promises.readFile(p);
        const cmd = await YAML.parse(buf.toString());
        cmd.template = await getTemplate(cmd.template);
        cmd.state = COMMANDS[cmd.name] ? 'running' : 'stopped';
        commands.push(cmd);
      } catch (err) {
        console.error(err);
      }
    })
  );

  res.status(200).send(sortBy(commands, 'name'));
});

app.post('/api/templates/:name/update', async (req, res) => {
  const { name: originalName } = req.params;
  const { name, bin, args } = req.body;

  if (!NAME_REGEX.test(originalName) || !NAME_REGEX.test(name)) {
    return res.status(422).send('Invalid name');
  }

  const p = path.resolve(config.get('template.directory'), `${name}.yml`);

  if (name !== originalName) {
    // Assert that updated name is not already used
    try {
      await fs.promises.access(p, fs.constants.F_OK);
      return res.status(422).send('Template already exists');
    } catch (err) {
      //
    }
  }

  try {
    if (name !== originalName) {
      console.log(originalName);
      // Delete previous
      await fs.promises.unlink(
        path.resolve(config.get('template.directory'), `${originalName}.yml`)
      );
    }

    await fs.promises.writeFile(
      p,
      YAML.stringify({
        name,
        bin,
        args,
      })
    );
    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send('');
  }
});

app.post('/api/templates/create', async (req, res) => {
  const { name, bin, args } = req.body;

  if (!NAME_REGEX.test(name)) {
    return res.status(422).send('Invalid name');
  }

  const p = path.resolve(config.get('template.directory'), `${name}.yml`);

  try {
    await fs.promises.access(p, fs.constants.F_OK);
    return res.status(422).send('Template already exists');
  } catch (err) {
    await fs.promises.writeFile(
      p,
      YAML.stringify({
        name,
        bin,
        args,
      })
    );
    return res.status(200).send('OK');
  }
});

app.get('/api/templates', async (req, res) => {
  const files = await fs.promises.readdir(config.get('template.directory'));

  const templates = [];
  await Promise.all(
    files.map(async (fileName) => {
      const buf = await fs.promises.readFile(
        path.resolve(config.get('template.directory'), fileName)
      );
      try {
        const str = buf.toString();
        const template = YAML.parse(str);
        templates.push(template);
      } catch (err) {
        console.log('Could not parse', `${fileName}`);
      }
    })
  );

  return res.status(200).send(sortBy(templates, 'name'));
});

app.get('/api/directory', async (req, res) => {
  const { path: pwd } = req.query;
  const p = path.resolve(config.get('directory'), pwd || '');

  const files = await fs.promises.readdir(p, {
    withFileTypes: true,
  });
  const directories = files.filter(
    (d) => d.isDirectory() && !d.name.startsWith('.')
  );

  return res.status(200).send({
    path: p,
    directories: directories.map((d) => d.name),
  });
});

io.on('connection', (socket) => {
  console.log(socket.id, 'connected');
  socket.on('listen-command-logs', ({ name }) => {
    console.log(socket.id, `listen to cmd '${name}'`);
    socket.join(`command-logs:${name}`);
    socket.emit(
      `command-logs:${name}`,
      COMMANDS[name] ? COMMANDS[name].logs : []
    );
  });
  socket.on('stop-listen-command-logs', ({ name }) => {
    socket.leave(`command-logs:${name}`);
    console.log(socket.id, `stop listen to cmd '${name}'`);
  });

  console.log('Connection');
});

const server = httpServer.listen(config.get('service.port'), () => {
  console.log(`Listening to http://localhost:${config.get('service.port')}/`);
});

process.on('SIGTERM', () => {
  server.close();
});
