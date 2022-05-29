export type ServiceSpec = {
  path?: string;
  env?: Record<string, string>;
  cmd: string[];
  pty?: boolean;
  logs: {
    json?: boolean;
    time?: boolean;
    delta?: boolean;
  };
};

export type StackSpec = {
  services: Record<string, ServiceSpec>;
};

export type ShipyardFileSpec = {
  stacks: Record<string, StackSpec>;
};

export type ServiceInfo = {
  /**
   * service key
   */
  key: string;
  /**
   * stack name
   */
  stack: string;
  /**
   * service spec
   */
  spec: ServiceSpec;
};

export type ServiceStateEnum =
  | 'off'
  | 'pending-assignment'
  | 'assigned'
  | 'running';
export type ServiceState = {
  name: string;
  state: ServiceStateEnum;
  assignedRunnerId?: string;

  current_task_id?: string;
  current_task_state?:
    | 'noop'
    | 'creating'
    | 'running'
    | 'stopping'
    | 'stopped'
    | 'exited';
};

export type Task = {
  id: string;
  service_name: string;
  service_spec: ServiceSpec;
  runner_id: string;
  creating_at?: Date;
  updated_at?: Date;
  running_at?: Date;
  stopping_at?: Date;
  stopped_at?: Date;
  exited_at?: Date;
  exit_code?: number;
};

export type TaskLog = {
  out: 0 | 1;
  task_id: string;
  text: string;
  date: Date;
};

export type Stack = {
  name: string;
  config_key: string;
  spec: StackSpec;
  to_remove?: boolean;

  created_at: number;
  updated_at: number;
};

export type StackRowConfig = {
  cells: {
    key: string;
    width: number;
  }[];
  height: number;
};
export type StackTab = {
  name: string;
  slug: string;
  keys: Record<string, true>;
  rows?: StackRowConfig[];
};

export type StackTabConfig = {
  stack: string;
  tabs: StackTab[];
  created_at: Date;
  updated_at: Date;
};
