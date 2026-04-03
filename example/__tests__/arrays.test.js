const delay = ms => new Promise(res => setTimeout(res, ms));

describe('Array operations', () => {
  test('maps over an array', async () => {
    await delay(400);
    expect([1, 2, 3].map(x => x * 2)).toEqual([2, 4, 6]);
  });

  test('filters an array', async () => {
    await delay(600);
    expect([1, 2, 3, 4].filter(x => x % 2 === 0)).toEqual([2, 4]);
  });

  test('reduces an array', async () => {
    await delay(800);
    expect([1, 2, 3, 4].reduce((a, b) => a + b, 0)).toBe(10);
  });

  test('finds an element', async () => {
    await delay(500);
    expect([1, 2, 3].find(x => x > 1)).toBe(2);
  });

  test.skip('skipped test example', () => {
    expect(true).toBe(false);
  });

  test('sorts an array', async () => {
    await delay(700);
    expect([3, 1, 2].sort()).toEqual([1, 2, 3]);
  });

  test('flattens nested array', async () => {
    await delay(1100);
    expect([1, [2, 3], [4]].flat()).toEqual([1, 2, 3, 4]);
  });

  test('checks array includes', async () => {
    await delay(900);
    expect([1, 2, 3].includes(2)).toBe(true);
  });
});
