import { createCancellableQueue } from '../src';
import {
  Cancel,
  CancellableApi,
  ErrorCancelActionDone,
} from '../src/cancellableQueue';

const sleep = (delay: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

describe('cancellable queue', () => {
  it('should call transaction one after another', async () => {
    const queue = createCancellableQueue();
    const fn1 = jest.fn(() => sleep(10));
    const fn2 = jest.fn(() => sleep(10));
    const fn3 = jest.fn(() => sleep(10));
    queue.transaction(fn1);
    queue.transaction(fn2);
    queue.transaction(fn3);
    await sleep(1);
    expect(fn1).toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
    expect(fn3).not.toHaveBeenCalled();
    await sleep(10);
    expect(fn2).toHaveBeenCalled();
    expect(fn3).not.toHaveBeenCalled();
    await sleep(10);
    expect(fn3).toHaveBeenCalled();
  });
  it('should run actions', async () => {
    const queue = createCancellableQueue();

    const fn = jest.fn();
    queue.transaction((api) => {
      api.addAction({
        data: fn,
      });
    });
    await sleep(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('should provide sync action error to onDone', async () => {
    const queue = createCancellableQueue();
    const error = {};
    queue.transaction((trx) => {
      trx.addAction({
        data() {
          throw error;
        },
        onDone(e) {
          expect(e).toBe(error);
        },
      });
    });
    await sleep(5);
  });
  it('should provide async action error to onDone', async () => {
    const queue = createCancellableQueue();
    const error = {};
    queue.transaction((trx) => {
      trx.addAction({
        async data() {
          await sleep(5);
          throw error;
        },
        onDone(e) {
          expect(e).toBe(error);
        },
      });
    });
    await sleep(10);
  });

  it('should properly set ongoing', async () => {
    const queue = createCancellableQueue();

    const fn = jest.fn(async () => {
      await sleep(10);
    });
    expect(queue.isActionOngoing).toBe(false);
    expect(queue.ongoingAction).toBe(null);
    queue.transaction((api) => {
      api.addAction({
        data: fn,
        onDone() {
          expect(queue.isActionOngoing).toBe(false);
          expect(queue.ongoingAction).toBe(null);
        },
      });
    });
    await sleep(3);
    expect(queue.isActionOngoing).toBe(true);

    await sleep(15);
  });

  describe('cancel', () => {
    it('should throw if cancel fail due to action not using cancellable api', async () => {
      expect.assertions(1);

      const queue = createCancellableQueue();
      const fn = jest.fn(async () => {
        await sleep(10);
      });
      queue.transaction((trx) => {
        trx.addAction({ data: fn });
      });
      await sleep(3);
      queue.transaction(async (trx) => {
        await expect(() => trx.cancelOngoing()).rejects.toThrowError(
          ErrorCancelActionDone
        );
      });
      await sleep(10);
    });

    it('should cancel api.wait', async () => {
      const queue = createCancellableQueue();
      let DONE = false;
      const fn = jest.fn(async (api: CancellableApi) => {
        await api.wait(10);
        DONE = true;
      });
      queue.transaction((trx) => {
        trx.addAction({
          data: fn,
        });
      });
      await sleep(3);
      queue.transaction(async (trx) => {
        await trx.cancelOngoing();
      });
      expect(fn).toBeCalled();
      expect(DONE).toBe(false);
      await sleep(20);
      expect(DONE).toBe(false);
    });

    it('should allow gracefull cancel action', async () => {
      const queue = createCancellableQueue();
      let DONE = false;
      let GRACEFUL_CANCEL = false;
      const fn = jest.fn(async (api: CancellableApi) => {
        try {
          await api.wait(10);
          DONE = true;
        } catch (err) {
          if (err instanceof Cancel) {
            await api.wait(10);
            GRACEFUL_CANCEL = true;
          }
        }
      });
      queue.transaction((trx) => {
        trx.addAction({
          data: fn,
        });
      });
      await sleep(1);
      queue.transaction((trx) => {
        trx.cancelOngoing();
      });
      expect(GRACEFUL_CANCEL).toBe(false);
      expect(DONE).toBe(false);
      await sleep(25);
      expect(GRACEFUL_CANCEL).toBe(true);
      expect(DONE).toBe(false);
    });
  });

  // describe('transaction', () => {
  // describe('action', () => {
  //   it('should provide error to afterDone', async () => {
  //     expect.assertions(2);
  //     const queue = createWorkflowQueue();
  //     queue.transaction(async (api) => {
  //       api.addAction({
  //         name: 'action',
  //         handler: () => {
  //           throw new Error('err');
  //         },
  //         arg: null,
  //         onDone: (err) => {
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBe('err');
  //         },
  //       });
  //     });
  //     await sleep(10);
  //   });
  //   it('should provide async error to afterDone', async () => {
  //     expect.assertions(2);
  //     const queue = createWorkflowQueue();
  //     queue.transaction(async (api) => {
  //       api.addAction({
  //         name: 'action',
  //         handler: async () => {
  //           await sleep(10);
  //           throw new Error('err');
  //         },
  //         arg: null,
  //         onDone: (err) => {
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBe('err');
  //         },
  //       });
  //     });
  //     await sleep(15);
  //   });
  // });
});
