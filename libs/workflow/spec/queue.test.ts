import { createQueue } from '../src';
import { ErrorQueueEnded, ErrorQueueDraining, QueueAction } from '../src/queue';

const sleep = (delay: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

describe('queue', () => {
  it('should handle action', async () => {
    expect.assertions(1);

    const action = {};
    const queue = createQueue<QueueAction<typeof action>>({
      handleAction(action) {
        expect(action).toBe(action);
      },
    });

    queue.addAction({ data: action });
    await sleep(1);
  });

  it('should handle action one at a time', async () => {
    const res = [];
    const queue = createQueue<QueueAction<[number, number]>>({
      handleAction: jest.fn(async ([sleepDur, r]) => {
        await sleep(sleepDur);
        res.push(r);
      }),
    });

    queue.addAction({ data: [5, 1] });
    queue.addAction({ data: [3, 2] });
    queue.addAction({ data: [1, 3] });
    await sleep(20);
    expect(res).toEqual([1, 2, 3]);
  });

  it('should set ongoing when processing action', async () => {
    const queue = createQueue({
      handleAction: async () => {
        await sleep(5);
      },
    });
    expect(queue.isOngoing).toBe(false);
    queue.addAction({ data: null });
    await sleep(1);
    expect(queue.isOngoing).toBe(true);
    await sleep(5);
    expect(queue.isOngoing).toBe(false);
  });

  it('should be done when onDone is called', async () => {
    expect.assertions(2);
    const queue = createQueue({
      handleAction: async () => {
        await sleep(1);
      },
    });
    expect(queue.isOngoing).toBe(false);
    queue.addAction({
      data: null,
      onDone() {
        expect(queue.isOngoing).toBe(false);
      },
    });
    await sleep(5);
  });

  it('should give queue size', async () => {
    const queue = createQueue({
      handleAction: async () => {
        await sleep(5);
        //
      },
    });
    queue.addAction({ data: null });
    expect(queue.queueSize).toBe(1);
    queue.addAction({ data: null });
    expect(queue.queueSize).toBe(2);
    queue.addAction({ data: null });
    expect(queue.queueSize).toBe(3);
    await sleep(1);
    expect(queue.queueSize).toBe(2);
    await sleep(20);
    expect(queue.queueSize).toBe(0);
  });

  it('should forward error to onDone with sync handle', async () => {
    const error = {};
    const queue = createQueue({
      handleAction: () => {
        throw error;
      },
    });
    queue.addAction({
      data: null,
      onDone(err) {
        expect(err).toBe(error);
      },
    });
    await sleep(5);
  });

  describe('end', () => {
    it('should prevent addActions when draining', () => {
      const queue = createQueue({
        handleAction: () => {
          //
        },
      });
      queue.addAction({ data: null });
      expect(queue.isDraining).toBe(false);
      queue.endAction({ data: null });
      expect(queue.isDraining).toBe(true);
      expect(() => queue.addAction({ data: null })).toThrowError(
        ErrorQueueDraining
      );
    });
    it('should mark queue as ended when endAction.onDone is called', async () => {
      expect.assertions(1);
      const queue = createQueue({
        handleAction: () => {
          //
        },
      });
      queue.endAction({
        data: null,
        onDone() {
          expect(queue.isEnded).toBe(true);
        },
      });
      await sleep(5);
    });

    it('should prevent addActions when ended', async () => {
      const queue = createQueue({
        handleAction: () => {
          //
        },
      });
      queue.endAction({ data: null });
      expect(queue.isEnded).toBe(false);
      await sleep(10);
      expect(queue.isEnded).toBe(true);

      expect(() => queue.addAction({ data: null })).toThrowError(
        ErrorQueueEnded
      );
    });

    it('should prevent endAction to be added twice', async () => {
      const queue = createQueue({
        handleAction: () => {
          //
        },
      });
      queue.endAction({ data: null });
      expect(() => queue.endAction({ data: null })).toThrowError(
        ErrorQueueDraining
      );
      await sleep(10);
    });
  });
});
