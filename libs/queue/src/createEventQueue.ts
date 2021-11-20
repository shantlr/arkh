import { HandlerContext, QueueDef, QUEUE_DEF } from './queue';
import { Event } from './event';

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
        (eventPayload: infer U, context: HandlerContext) => void
      >
    ? Record<
        string,
        (eventPayload: U, context: HandlerContext) => void | Promise<void>
      >
    : never;
};

/**
 * Map EventHandler into event creator object
 */
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

/**
 * Extract all possible events from EventHandlers
 */
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

/**
 * Helper to create single queue with multiple event handlers
 */
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

  const handlerByType: Record<
    string,
    (event: PossibleEvents<T>, context: HandlerContext) => void | Promise<void>
  > = {};

  for (const eventType in queueEvents) {
    // Add event creator
    // @ts-ignore
    eventCreator[eventType] = (
      // @ts-ignore
      eventPayload: Parameters<T[typeof eventType]>[0]
    ) => {
      return {
        type: eventType,
        queue: name,
        payload: eventPayload,
      };
    };

    const handler = queueEvents[eventType];
    // add event type handler
    if (typeof handler === 'function') {
      handlerByType[eventType] = (
        event: PossibleEvents<T>,
        context: HandlerContext
      ) => handler(event.payload, context);
    } else {
      // record of multiple sub handler
      const subHandlers = Object.keys(handler).map((subHandlerKey) => {
        if (typeof handler[subHandlerKey] === 'function') {
          return handler[subHandlerKey];
        }
        throw new Error(
          `unexpected sub handler '${subHandlerKey}' for event '${eventType}' in queue '${name}'`
        );
      });
      handlerByType[eventType] = async (event, context) => {
        await Promise.all(
          subHandlers.map((subHandler) => subHandler(event.payload, context))
        );
      };
    }
  }

  queue.consumers.push({
    name,
    handler: (event, context) => {
      if (event.type in handlerByType) {
        return handlerByType[event.type](event, context);
      }
      throw new Error(
        `unexpected event type: '${event.type}' in queue '${name}'`
      );
    },
  });

  return eventCreator;
};
