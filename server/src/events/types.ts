export type ServiceConfig = {
  path?: string;
  env?: Record<string, string | number | boolean>;
  cmd: string;
};

export type StackConfig = {
  services: Record<string, ServiceConfig>;
};

export type MetroConfig = {
  stacks: Record<string, StackConfig>;
};
