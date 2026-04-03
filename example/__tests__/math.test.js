const delay = ms => new Promise(res => setTimeout(res, ms));

describe('Math operations', () => {
  test('adds two numbers', async () => {
    await delay(200);
    expect(1 + 2).toBe(3);
  });

  test('subtracts two numbers', async () => {
    await delay(400);
    expect(10 - 4).toBe(6);
  });

  test('multiplies two numbers', async () => {
    await delay(300);
    expect(3 * 4).toBe(12);
  });

  test('divides two numbers', async () => {
    await delay(500);
    expect(10 / 2).toBe(5);
  });

  test('handles division by zero', async () => {
    await delay(700);
    expect(1 / 0).toBe(Infinity);
  });

  test('computes large sum', async () => {
    await delay(2000);
    const sum = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0);
    expect(sum).toBe(499500);
  });

  test('wrong math intentional fail', async () => {
    await delay(600);
    expect(2 + 2).toBe(5);
  });

  test('checks prime number', async () => {
    await delay(1200);
    const isPrime = n => {
      for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
      return n > 1;
    };
    expect(isPrime(17)).toBe(true);
  });
});
