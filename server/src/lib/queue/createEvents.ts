import { Event, HandlerContext, QueueDef, QUEUE_DEF } from './base';

type EventHandlers<T> = {
  [eventName in keyof T]: T[eventName] extends (
    eventPayload: infer EventPayload,
    context: HandlerContext
  ) => void | Promise<void>
    ? (
        eventPayload: EventPayload,
        context: HandlerContext
      ) => void | Promise<void>
    : T[eventName] extends Record<
        string,
        (eventPaylad: infer U, context: HandlerContext) => void
      >
    ? Record<
        string,
        (eventPayload: U, context: HandlerContext) => void | Promise<void>
      >
    : never;
};

type EventCreators<T, QueueName> = {
  [eventName in keyof T]: T[eventName] extends (
    eventPayload: infer U,
    context: HandlerContext
  ) => void | Promise<void>
    ? (eventPayload: U) => {
        type: eventName;
        queue: QueueName;
        payload: Parameters<T[eventName]>[0];
      }
    : T[eventName] extends Record<
        string,
        (eventPayload: infer U, context: HandlerContext) => void | Promise<void>
      >
    ? (eventPayload: U) => {
        type: eventName;
        queue: QueueName;
        payload: U;
      }
    : never;
};

type PossibleEvents<
  T extends Record<string, unknown>,
  U = keyof T
  // U extends keyof T & string = T extends Record<string, any> ? keyof T : never
> = U extends keyof T & string
  ? T[U] extends (
      eventPayload: infer Payload,
      context: HandlerContext
    ) => void | Promise<void>
    ? Event<Payload, U>
    : T[U] extends Record<
        string,
        (
          eventPayload: infer Payload,
          context: HandlerContext
        ) => void | Promise<void>
      >
    ? Event<Payload, U>
    : never
  : never;

export const createEventQueue = <
  T extends EventHandlers<T>,
  QueueName extends string
>(
  name: QueueName,
  queueEvents: T
): EventCreators<T, QueueName> & {
  [QUEUE_DEF]: QueueDef<PossibleEvents<T>>;
} => {
  const queue: QueueDef<PossibleEvents<T>> = {
    name,
    consumers: [],
  };

  const eventCreator: EventCreators<T, QueueName> & {
    [QUEUE_DEF]: QueueDef<PossibleEvents<T>>;
  } = {
    [QUEUE_DEF]: queue,
  } as EventCreators<T, QueueName> & {
    [QUEUE_DEF]: QueueDef<PossibleEvents<T>>;
  };

  for (const key in queueEvents) {
    // @ts-ignore
    eventCreator[key] = (eventPayload: Parameters<T[typeof key]>[0]) => {
      return {
        type: key,
        queue: name,
        payload: eventPayload,
      };
    };

    const handler = queueEvents[key];
    if (typeof handler === 'function') {
      queue.consumers.push({
        name: key,
        handler: (event, context) => {
          if (event.type === key) {
            return handler(event.payload, context);
          }
        },
      });
    } else {
      for (const subHandlerKey in handler) {
        const subHandler = handler[subHandlerKey];
        if (typeof subHandler === 'function') {
          queue.consumers.push({
            name: `${key}.${subHandlerKey}`,
            handler: (event, context) => {
              if (event.type === key) {
                return subHandler(event.payload, context);
              }
            },
          });
        } else {
          throw new Error(
            `Unexpected sub handler of type: ${typeof subHandler} at '${key}.${subHandlerKey}'`
          );
        }
      }
    }
  }

  return eventCreator;
};
