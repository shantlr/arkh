import Emittery from 'emittery';

export const SideEffects = new Emittery<{
  addStack: { name: string };
  updateStack: { name: string };
  removeStack: { name: string };
  updateStackState: any;

  addService: { stackName: string; fullName: string };
  updateService: { stackName: string; fullName: string };
  updateServiceState: { fullName: string };
  removeService: { stackName: string; fullName: string };

  addTask: any;
  taskLogs: { taskId: string };
}>();
