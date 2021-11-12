import { EventEmitter } from 'events';
import { createLogger, Logger } from '../logger';

export type EventPayload<T> = T extends { payload: infer U } ? U : never;

export type Event<Payload, EventType extends string = string> = {
  type: EventType;
  queue?: string;
  payload: Payload;
};
export type AnyEvent = Event<any>;

type Handler<T extends AnyEvent> = (
  event: T,
  context: HandlerContext
) => void | Promise<void>;

export type HandlerContext = {
  dispatcher: EventQueue;
  logger: Logger;
};

export class Queue<T extends AnyEvent> {
  name: string;
  events: T[] = [];
  consumers: QueueConsumer<T>[] = [];
  started = false;

  constructor({ name }) {
    this.name = name;
  }

  addConsumer(consumer: QueueConsumer<T>) {
    this.consumers.push(consumer);
  }
  push(event: T) {
    this.events.push(event);
    this.consumers.forEach((consumer) => {
      consumer.consume().catch((err) => {
        throw err;
      });
    });
  }

  start() {
    if (this.started) {
      return;
    }
    this.started = true;
    this.consumers.forEach((consumer) => {
      consumer.start().catch((err) => {
        throw err;
      });
    });
  }
  async stop() {
    this.started = false;
  }

  cleanEvents() {
    //
  }

  hasEvent(offset: number) {
    return offset < this.events.length;
  }
  getEvent(offset: number) {
    return this.events[offset];
  }
}

export const QUEUE_DEF = Symbol('Queue definition');
export interface QueueDef<T extends AnyEvent> {
  name: string;
  consumers?: ConsumerDef<T>[];
}
export interface ConsumerDef<T extends AnyEvent> {
  name: string;
  handler: Handler<T>;
}

export class QueueConsumer<T extends AnyEvent> {
  ongoing = false;
  shouldStop = false;
  queue: Queue<T>;
  offset = 0;
  handler: Handler<T>;
  handlerContext: HandlerContext;

  events = new EventEmitter();

  constructor({
    queue,
    handler,
    context,
  }: {
    queue: Queue<T>;
    handler: Handler<T>;
    context: HandlerContext;
  }) {
    this.queue = queue;
    this.offset = 0;
    this.handler = handler;
    this.handlerContext = context;
    queue.addConsumer(this);
  }

  start() {
    return this.consume();
  }
  consume() {
    if (this.ongoing) {
      return;
    }
    return this.consumeEvents();
  }
  async consumeEvents() {
    this.ongoing = true;

    try {
      while (!this.shouldStop && this.queue.hasEvent(this.offset)) {
        const event = this.queue.getEvent(this.offset);
        await this.handler(event, this.handlerContext);
        this.offset += 1;
      }
    } finally {
      this.ongoing = false;
      if (this.shouldStop) {
        this.shouldStop = true;
        this.events.emit('stopped');
      }
    }
  }
  stop() {
    if (!this.ongoing) {
      return Promise.resolve();
    }
    this.shouldStop = true;
    return new Promise((resolve) => this.events.once('stopped', resolve));
  }
}

type AnyQueue = Queue<any>;
export class EventQueue {
  queues: Map<string, AnyQueue> = new Map();
  started = false;
  logger = createLogger('eventmanager');

  getQueue<T extends AnyEvent>(queueName: string): Queue<T> {
    if (!this.queues.has(queueName)) {
      this.queues.set(
        queueName,
        new Queue({
          name: queueName,
        })
      );
    }
    return this.queues.get(queueName) as Queue<T>;
  }
  push<T>(event: Event<T>) {
    const queue = this.getQueue(event.queue || event.type);
    queue.push(event);
  }

  addQueue<T extends AnyEvent>(queueDef: QueueDef<T>) {
    const queue = new Queue<T>({
      name: queueDef.name,
    });
    this.queues.set(queueDef.name, queue);
    this.logger.info(`queue '${queue.name}' added`);

    if (queueDef.consumers) {
      queueDef.consumers.forEach((consumerDef) => {
        const consumer = new QueueConsumer<T>({
          queue,
          handler: consumerDef.handler,
          context: {
            dispatcher: this,
            logger: createLogger(`events:${queue.name}:${consumerDef.name}`),
          },
        });
        this.logger.info(`consumer '${queue.name}.${consumerDef.name}' added`);
      });
    }
    return this;
  }
  addQueues(...queues: (QueueDef<any> | { [QUEUE_DEF]: QueueDef<any> })[]) {
    queues.forEach((queue) => {
      if (QUEUE_DEF in queue) {
        this.addQueue(queue[QUEUE_DEF]);
      } else {
        this.addQueue(queue as QueueDef<any>);
      }
    });
  }

  startConsumeEvent() {
    if (this.started) {
      return;
    }

    this.started = true;
    this.queues.forEach((queue) => {
      queue.start();
    });
  }
}

export const handler = <T>(
  fn: (eventPayload: T, context: HandlerContext) => void | Promise<void>
) => fn;
export const handlers = <T>(
  fns: Record<
    string,
    (eventPayload: T, context: HandlerContext) => void | Promise<void>
  >
) => fns;
