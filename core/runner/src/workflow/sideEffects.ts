import { ServiceSpec } from '@shantlr/shipyard-common-types';
import Emittery from 'emittery';

import { TaskState } from '../lib/task';

export const SideEffects = new Emittery<{
  taskStateUpdate: {
    id: string;
    serviceName: string;
    state: TaskState;
    spec?: ServiceSpec;
    exitCode?: number;
  };
  taskStdout: { id: string; serviceName: string; log: string };
  taskStderr: { id: string; serviceName: string; log: string };
}>({});
