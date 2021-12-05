import { StackSpec } from '@shantr/metro-common-types';

export type Stack = {
  created_at: number;
  name: string;
  to_remove: boolean;
  updated_at: number;
  spec: StackSpec;
};

export type ServiceTask = {
  id: string;

  runner_id: string;

  service_name: string;
  service_spec: any;

  creating_at: number;
  running_at: number;
  exited_at: number;
  exit_code: number;

  stopped_at: number;
  stopping_at: number;
};
