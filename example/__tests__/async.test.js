const delay = ms => new Promise(res => setTimeout(res, ms));

describe('Async operations', () => {
  test('resolves a promise', async () => {
    await delay(300);
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  test('fetches user data', async () => {
    await delay(1500);
    const user = { id: 1, name: 'Alice' };
    expect(user.name).toBe('Alice');
  });

  test('rejects a promise correctly', async () => {
    await delay(600);
    await expect(Promise.reject(new Error('oops'))).rejects.toThrow('oops');
  });

  test('intentional async failure', async () => {
    await delay(400);
    const result = await Promise.resolve('hello');
    expect(result).toBe('world');
  });

  test('processes batch job', async () => {
    await delay(2200);
    expect([1, 2, 3].length).toBe(3);
  });

  test('syncs with remote server', async () => {
    await delay(3000);
    expect(true).toBe(true);
  });

  test('retries on timeout', async () => {
    await delay(1800);
    expect(42).toBe(42);
  });

  test('validates auth token', async () => {
    await delay(900);
    const token = 'abc123';
    expect(token.length).toBeGreaterThan(0);
  });
});
