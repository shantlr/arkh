import { createWorkflowEntity, wkAction } from "../src";

const sleep = (delay: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

describe("workflow entity", () => {
  it("should call action handler", async () => {
    const fn = jest.fn(
      wkAction(() => {
        //
      })
    );
    const { state, internalActions, ...entity } = createWorkflowEntity(
      {},
      {
        actions: {
          act: fn,
        },
      }
    );
    await entity.actions.act(null, { promise: true });
    expect(fn).toBeCalled();
  });

  it("should call action handler with arg", async () => {
    const arg = {};
    const fn = jest.fn(
      wkAction<typeof arg>((a) => {
        expect(a).toBe(arg);
      })
    );
    const { state, internalActions, ...entity } = createWorkflowEntity(
      {},
      {
        actions: {
          act: fn,
        },
      }
    );
    await entity.actions.act(arg, { promise: true });
    await sleep(0);
    expect(fn).toBeCalled();
  });

  describe("trx api", () => {
    it("should wait", async () => {
      let DONE = false;
      const fn = jest.fn(
        wkAction(async (a, api) => {
          await api.wait(10);
          DONE = true;
        })
      );
      const { state, internalActions, ...entity } = createWorkflowEntity(
        {},
        {
          actions: {
            act: fn,
          },
        }
      );
      entity.actions.act();
      expect(DONE).toBe(false);
      await sleep(0);
      expect(DONE).toBe(false);
      expect(fn).toHaveBeenCalled();
      await sleep(10);
      expect(DONE).toBe(true);
    });
  });
});
