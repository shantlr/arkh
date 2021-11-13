export type ServiceSpec = {
  path?: string;
  env?: Record<string, string>;
  cmd: string[];
};

export type StackSpec = {
  services: Record<string, ServiceSpec>;
};

export type MetroSpec = {
  stacks: Record<string, StackSpec>;
};
