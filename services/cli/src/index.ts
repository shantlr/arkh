import { Command } from 'commander';
import express from 'express';
import path from 'path';

const PUBLIC_PATH =
  process.env.PUBLIC_PATH || path.resolve(__dirname, 'public');
const INDEX_PATH = path.resolve(PUBLIC_PATH, 'index.html');

const prog = new Command();

prog.name('arkh');

prog
  .command('run', { isDefault: true })
  .option('-p, --port <port>', '', '9055')
  .action((options) => {
    const app = express();

    app.use(express.static(PUBLIC_PATH));
    app.get('*', (req, res) => {
      return res.sendFile(INDEX_PATH);
    });

    const port = Number(options.port);
    if (isNaN(port)) {
      throw new Error('port is invalid');
    }

    app.listen(port, () => {
      console.log(`Arkh ready at http://localhost:${port}`);
    });
  });

prog.parseAsync().catch((err) => {
  console.error(err);
  process.exit(1);
});
