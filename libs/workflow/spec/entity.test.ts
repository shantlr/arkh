import { createEntity } from '../src';

const sleep = (delay: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

describe('entity', () => {
  it('should call action handler', async () => {
    const arg = {};
    const fn = jest.fn((a) => {
      expect(a).toBe(arg);
    });
    const entity = createEntity(
      {},
      {
        actions: {
          act: fn,
        },
      }
    );
    await entity.actions.act(arg, { promise: true });
    expect(fn).toBeCalled();
    expect(entity.ongoingAction).toBe(null);
    expect(entity.actionQueueSize).toBe(0);
    expect(entity.isActionOngoing).toBe(false);
  });
  it('should resolve action handler', async () => {
    let done = false;
    const fn = jest.fn(async (a) => {
      await sleep(10);
      done = true;
    });
    const entity = createEntity(
      {},
      {
        actions: {
          act: fn,
        },
      }
    );
    await entity.actions.act(null, { promise: true });
    expect(fn).toBeCalled();
    expect(done).toBe(true);
    expect(entity.ongoingAction).toBe(null);
    expect(entity.actionQueueSize).toBe(0);
    expect(entity.isActionOngoing).toBe(false);
  });

  it('should resolve action in order', async () => {
    const state = { value: 0 };
    const entity = createEntity(state, {
      actions: {
        async add(value: number) {
          await sleep(5);
          state.value += value;
        },
        async mul(value: number) {
          await sleep(5);
          state.value *= value;
        },
      },
    });
    await Promise.all([
      entity.actions.add(5, { promise: true }),
      entity.actions.mul(2, { promise: true }),
      entity.actions.add(1, { promise: true }),
    ]);
    expect(entity.state.value).toBe(11);
  });

  it('should propagate rejection', async () => {
    const entity = createEntity(
      {},
      {
        actions: {
          act: async () => {
            await sleep(5);
            throw new Error('test');
          },
        },
      }
    );

    await expect(() =>
      entity.actions.act(null, { promise: true })
    ).rejects.toThrow('test');
  });
  it('should propagate sync throw', async () => {
    const entity = createEntity(
      {},
      {
        actions: {
          act: () => {
            throw new Error('test');
          },
        },
      }
    );

    await expect(() =>
      entity.actions.act(null, { promise: true })
    ).rejects.toThrow('test');
  });
});
