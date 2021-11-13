export type EventPayload<T> = T extends { payload: infer U } ? U : never;

export type Event<Payload, EventType extends string = string> = {
  type: EventType;
  queue?: string;
  payload: Payload;
};
