import Emittery from 'emittery';
import { TaskState } from 'src/lib/task';

export const SideEffects = new Emittery<{
  taskStateUpdate: { serviceName: string; state: TaskState };
  taskStdout: { serviceName: string; log: string };
  taskStderr: { serviceName: string; log: string };
}>({});
