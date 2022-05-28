import { createWorkflowEntity, createWorkflowEntityGroup } from '../src';

const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

describe('workflow group', () => {
  it('should add entity', async () => {
    const initEntity = jest.fn(() =>
      createWorkflowEntity(null, {
        actions: {
          test: () => {
            //
          },
        },
        //
      })
    );
    const group = createWorkflowEntityGroup({
      name: 'group-test',
      initEntity,
    });

    const key = 'k';
    expect(group.has(key)).toBe(false);
    const member = group.get(key);
    expect(group.has(key)).toBe(false);

    const p = member.actions.test(null, { promise: true });
    expect(group.has(key)).toBe(true);

    await p;
    expect(initEntity).toHaveBeenCalledTimes(1);
  });

  it('should call action', async () => {
    const test = jest.fn(() => {
      //
    });
    const initEntity = jest.fn(() =>
      createWorkflowEntity(null, {
        actions: {
          test,
        },
      })
    );

    const group = createWorkflowEntityGroup({
      name: 'group-test',
      initEntity,
    });
    const member = group.get('k');
    await member.actions.test(null, { promise: true });
    expect(test).toHaveBeenCalledTimes(1);
  });

  it('should leave', async () => {
    const test = jest.fn(async () => {
      //
    });
    const initEntity = jest.fn(() =>
      createWorkflowEntity(null, {
        actions: {
          test,
        },
      })
    );

    const group = createWorkflowEntityGroup({
      name: 'group-test',
      initEntity,
    });
    const key = 'k';
    const member = group.get(key);
    await member.actions.test(null, { promise: true });
    expect(group.has(key)).toBe(true);
    await group.leave(key);
    expect(group.has(key)).toBe(false);
  });
  it('should rejoin after leave', async () => {
    const test = jest.fn(async () => {
      //
    });
    const initEntity = jest.fn(() =>
      createWorkflowEntity(null, {
        actions: {
          test,
        },
      })
    );

    const group = createWorkflowEntityGroup({
      name: 'group-test',
      initEntity,
    });
    const key = 'k';
    const member = group.get(key);
    member.actions.test(null);
    void group.leave(key);
    await member.actions.test(null, { promise: true });
    expect(group.has(key)).toBe(true);
    expect(initEntity).toHaveBeenCalledTimes(2);
  });
});
