import Emittery from 'emittery';

export const SideEffects = new Emittery<{
  addStack: { name: string };
  updateStack: { name: string };
  removeStack: { name: string };
  updateStackState: any;

  addService: { name: string };
  updateService: { name: string };
  updateServiceState: any;
  removeService: { name: string };

  addTask: any;
  taskLogs: any;
}>();
