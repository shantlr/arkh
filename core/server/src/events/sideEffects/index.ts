import Emittery from 'emittery';

export const SideEffects = new Emittery<{
  addStack: { name: string };
  updateStack: { name: string };
  removeStack: { name: string };
  updateStackState: any;

  addService: { serviceName: string };
  updateService: { serviceName: string };
  updateServiceState: { serviceName: string };
  removeService: { serviceName: string };

  addTask: { id: string; created_at: Date; serviceName: string };
  updateTask: {
    id: string;
    running_at?: Date;
    stopping_at?: Date;
    stopped_at?: Date;
    exited_at?: Date;
    exit_code?: number;
  };
  taskLog: { task_id: string; out?: 0 | 1; text: string; date: Date };
}>();
