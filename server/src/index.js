import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import cors from 'cors';

import { config } from './config';
import { createSocketServer } from './socket';
import { createApiRouter } from './routes';

const app = express();
const httpServer = createServer(app);
const { io } = createSocketServer(httpServer);

app.use(cors(), bodyParser.json());

app.get('/', (req, res) => {
  res.redirect('/app');
});

// const COMMANDS = {};

// const mapCommand = (cmd) => {
//   return {
//     bin: cmd.template.bin,
//     args: cmd.template.args.map((arg) => {
//       if (arg.type === 'static') {
//         return arg.value;
//       }
//       if (arg.type === 'variable') {
//         return cmd.params[arg.name];
//       }
//       return null;
//     }),
//   };
// };

app.use('/api', createApiRouter({ io }));

const server = httpServer.listen(config.get('service.port'), () => {
  console.log(`Listening to http://localhost:${config.get('service.port')}/`);
});

process.once('SIGUSR2', () => {
  server.close(() => {
    console.log('Exiting...');
    process.exit();
  });
});
