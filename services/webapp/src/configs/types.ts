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

export type ServiceTaskLog = {
  out: 0 | 1;
  text: string;
  date: number;
};
