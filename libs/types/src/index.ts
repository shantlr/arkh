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
}