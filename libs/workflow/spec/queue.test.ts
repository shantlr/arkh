import { createQueue } from '../src';
import { ErrorQueueEnded, ErrorQueueDraining, QueueAction } from '../src/queue';

const sleep = (delay: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

describe('workflow queue', () => {
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

  describe('end', () => {
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
  });

  // it('should queue actions', async () => {
  //   const action = {};
  //   const queue = createQueue<QueueAction<typeof action>>({
  //     handleAction(action) {
  //       expect(action).toBe(action);
  //     },
  //   });

  //   queue.addAction({ data: action });
  //   await sleep(1);
  // });
  // describe('transaction', () => {
  //   it('should call transaction one after another', async () => {
  //     const queue = createWorkflowQueue();
  //     const fn1 = jest.fn(() => sleep(10));
  //     const fn2 = jest.fn(() => sleep(10));
  //     const fn3 = jest.fn(() => sleep(10));
  //     queue.transaction(fn1);
  //     queue.transaction(fn2);
  //     queue.transaction(fn3);
  //     expect(fn1).toHaveBeenCalled();
  //     expect(fn2).not.toHaveBeenCalled();
  //     expect(fn3).not.toHaveBeenCalled();
  //     await sleep(10);
  //     expect(fn2).toHaveBeenCalled();
  //     expect(fn3).not.toHaveBeenCalled();
  //     await sleep(10);
  //     expect(fn3).toHaveBeenCalled();
  //   });
  //   it('should add action and run it', async () => {
  //     const queue = createWorkflowQueue();
  //     const arg = {};
  //     const fn = jest.fn(() => {
  //       //
  //     });
  //     queue.transaction((trx) => {
  //       trx.addAction({
  //         name: 'test',
  //         handler: fn,
  //         arg,
  //       });
  //     });
  //     expect(fn).not.toBeCalled();
  //     await sleep(0);
  //     expect(fn).toBeCalled();
  //   });
  //   it('should cancel action', async () => {
  //     const queue = createWorkflowQueue();
  //     let DONE = false;
  //     const arg = {};
  //     const fn = jest.fn(
  //       wkAction(async (a, api) => {
  //         await api.wait(10);
  //         DONE = true;
  //       })
  //     );
  //     queue.transaction((trx) => {
  //       trx.addAction({
  //         name: 'test',
  //         handler: fn,
  //         arg,
  //       });
  //     });
  //     await sleep(0);
  //     queue.transaction((trx) => {
  //       trx.cancelOngoing();
  //     });
  //     expect(fn).toBeCalled();
  //     expect(DONE).toBe(false);
  //     // sagaAction should be stopped
  //     await sleep(20);
  //     expect(DONE).toBe(false);
  //   });
  //   it('should gracefully cancel action', async () => {
  //     const queue = createWorkflowQueue();
  //     let DONE = false;
  //     let GRACEFUL_CANCEL = false;
  //     const arg = {};
  //     const fn = jest.fn(
  //       wkAction(async (a, api) => {
  //         try {
  //           await api.wait(10);
  //           DONE = true;
  //         } catch (err) {
  //           if (err === WorkflowCancel) {
  //             await api.wait(10);
  //             GRACEFUL_CANCEL = true;
  //           }
  //         }
  //       })
  //     );
  //     queue.transaction((trx) => {
  //       trx.addAction({
  //         name: 'test',
  //         handler: fn,
  //         arg,
  //       });
  //     });
  //     await sleep(0);
  //     queue.transaction((trx) => {
  //       trx.cancelOngoing();
  //     });
  //     expect(fn).toBeCalled();
  //     expect(GRACEFUL_CANCEL).toBe(false);
  //     expect(DONE).toBe(false);
  //     await sleep(30);
  //     expect(GRACEFUL_CANCEL).toBe(true);
  //     expect(DONE).toBe(false);
  //   });
  //   it('should have no ongoing action when done', async () => {
  //     const queue = createWorkflowQueue();
  //     expect(queue.isActionOngoing).toBe(false);
  //     expect(queue.ongoingAction).toBe(null);
  //     queue.transaction(async () => {
  //       await sleep(10);
  //     });
  //     await sleep(15);
  //     expect(queue.isActionOngoing).toBe(false);
  //     expect(queue.ongoingAction).toBe(null);
  //   });
  // });
  // // describe("yield", () => {
  // //   it("should await promise", async () => {
  // //     const queue = createWorkflowQueue();
  // //     let DONE = false;
  // //     const arg = {};
  // //     const fn = jest.fn(* sagaAction() {
  // //       yield sleep(10);
  // //       DONE = true;
  // //     });
  // //     queue.transaction((trx) => {
  // //       trx.addAction({
  // //         name: "test",
  // //         saga: fn,
  // //         arg,
  // //       });
  // //     });
  // //     await sleep(0);
  // //     expect(fn).toBeCalled();
  // //     expect(DONE).toBe(false);
  // //     await sleep(10);
  // //     expect(DONE).toBe(true);
  // //   });
  // // });
  // describe('action', () => {
  //   describe('promise api', () => {
  //     it('should cancel action', async () => {
  //       const queue = createWorkflowQueue();
  //       let DONE = false;
  //       const arg = {};
  //       const fn = jest.fn(
  //         wkAction(async (a, api) => {
  //           await api.wait(10);
  //           DONE = true;
  //         })
  //       );
  //       queue.transaction((trx) => {
  //         trx.addAction({
  //           name: 'test',
  //           handler: fn,
  //           arg,
  //         });
  //       });
  //       await sleep(0);
  //       queue.transaction((trx) => {
  //         trx.cancelOngoing();
  //       });
  //       expect(fn).toBeCalled();
  //       expect(DONE).toBe(false);
  //       // wkAction should be stopped
  //       await sleep(20);
  //       expect(DONE).toBe(false);
  //     });
  //   });
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
