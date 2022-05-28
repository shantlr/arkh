import {
  createWorkflowQueue,
  wkAction,
  WorkflowCancel,
} from '../src/workflowQueue';

const sleep = (delay: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

describe('workflow queue', () => {
  describe('transaction', () => {
    it('should call transaction one after another', async () => {
      const queue = createWorkflowQueue();
      const fn1 = jest.fn(() => sleep(10));
      const fn2 = jest.fn(() => sleep(10));
      const fn3 = jest.fn(() => sleep(10));

      queue.transaction(fn1);
      queue.transaction(fn2);
      queue.transaction(fn3);
      expect(fn1).toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
      await sleep(10);
      expect(fn2).toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
      await sleep(10);
      expect(fn3).toHaveBeenCalled();
    });

    it('should add action and run it', async () => {
      const queue = createWorkflowQueue();

      const arg = {};
      const fn = jest.fn(() => {
        //
      });

      queue.transaction((trx) => {
        trx.addAction({
          name: 'test',
          handler: fn,
          arg,
        });
      });
      expect(fn).not.toBeCalled();
      await sleep(0);
      expect(fn).toBeCalled();
    });

    it('should cancel action', async () => {
      const queue = createWorkflowQueue();

      let DONE = false;
      const arg = {};
      const fn = jest.fn(
        wkAction(async (a, api) => {
          await api.wait(10);
          DONE = true;
        })
      );

      queue.transaction((trx) => {
        trx.addAction({
          name: 'test',
          handler: fn,
          arg,
        });
      });
      await sleep(0);
      queue.transaction((trx) => {
        trx.cancelOngoing();
      });
      expect(fn).toBeCalled();
      expect(DONE).toBe(false);
      // sagaAction should be stopped
      await sleep(20);
      expect(DONE).toBe(false);
    });

    it('should gracefully cancel action', async () => {
      const queue = createWorkflowQueue();

      let DONE = false;
      let GRACEFUL_CANCEL = false;
      const arg = {};
      const fn = jest.fn(
        wkAction(async (a, api) => {
          try {
            await api.wait(10);
            DONE = true;
          } catch (err) {
            if (err === WorkflowCancel) {
              await api.wait(10);
              GRACEFUL_CANCEL = true;
            }
          }
        })
      );

      queue.transaction((trx) => {
        trx.addAction({
          name: 'test',
          handler: fn,
          arg,
        });
      });
      await sleep(0);
      queue.transaction((trx) => {
        trx.cancelOngoing();
      });
      expect(fn).toBeCalled();
      expect(GRACEFUL_CANCEL).toBe(false);
      expect(DONE).toBe(false);
      await sleep(30);
      expect(GRACEFUL_CANCEL).toBe(true);
      expect(DONE).toBe(false);
    });

    it('should have no ongoing action when done', async () => {
      const queue = createWorkflowQueue();

      expect(queue.isActionOngoing).toBe(false);
      expect(queue.ongoingAction).toBe(null);
      queue.transaction(async () => {
        await sleep(10);
      });
      expect(queue.isActionOngoing).toBe(false);
      expect(queue.ongoingAction).toBe(null);
    });
  });

  // describe("yield", () => {
  //   it("should await promise", async () => {
  //     const queue = createWorkflowQueue();

  //     let DONE = false;
  //     const arg = {};
  //     const fn = jest.fn(* sagaAction() {
  //       yield sleep(10);
  //       DONE = true;
  //     });

  //     queue.transaction((trx) => {
  //       trx.addAction({
  //         name: "test",
  //         saga: fn,
  //         arg,
  //       });
  //     });
  //     await sleep(0);
  //     expect(fn).toBeCalled();
  //     expect(DONE).toBe(false);
  //     await sleep(10);
  //     expect(DONE).toBe(true);
  //   });
  // });

  describe('action', () => {
    describe('promise api', () => {
      it('should cancel action', async () => {
        const queue = createWorkflowQueue();

        let DONE = false;
        const arg = {};
        const fn = jest.fn(
          wkAction(async (a, api) => {
            await api.wait(10);
            DONE = true;
          })
        );

        queue.transaction((trx) => {
          trx.addAction({
            name: 'test',
            handler: fn,
            arg,
          });
        });
        await sleep(0);
        queue.transaction((trx) => {
          trx.cancelOngoing();
        });
        expect(fn).toBeCalled();
        expect(DONE).toBe(false);
        // wkAction should be stopped
        await sleep(20);
        expect(DONE).toBe(false);
      });
    });
  });
});
