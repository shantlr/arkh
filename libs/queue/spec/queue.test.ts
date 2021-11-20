import { EventQueue, createEventQueue } from '../src';

describe('createEventQueue', () => {
  it('should run handler one after another - sync', (done) => {
    const eventManager = new EventQueue();

    const order = [];

    const first = jest.fn(() => void order.push('first'));
    const second = jest.fn(() => void order.push('second'));
    const third = jest.fn(() => void order.push('third'));
    const test = createEventQueue('test', {
      first,
      second,
      third,
    });

    eventManager.addQueues(test);
    eventManager.startConsumeEvent();
    eventManager.push(test.first({}));
    eventManager.push(test.second({}));
    eventManager.push(test.third({}));

    setTimeout(() => {
      expect(order).toEqual(['first', 'second', 'third']);
      done();
    }, 0);
  });

  it('should run handler one after another - async', (done) => {
    const eventManager = new EventQueue();

    const order = [];

    const sleep = () => new Promise((resolve) => setTimeout(resolve, 200));

    const first = jest.fn(async () => {
      await sleep();
      order.push('first');
    });
    const second = jest.fn(async () => {
      await sleep();
      order.push('second');
    });
    const third = jest.fn(() => void order.push('third'));
    const test = createEventQueue('test', {
      first,
      second,
      third,
    });

    eventManager.addQueues(test);
    eventManager.startConsumeEvent();
    eventManager.push(test.first({}));
    eventManager.push(test.second({}));
    eventManager.push(test.third({}));

    setTimeout(() => {
      expect(order).toEqual(['first', 'second', 'third']);
      done();
    }, 600);
  });
});
