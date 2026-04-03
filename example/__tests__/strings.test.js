const delay = ms => new Promise(res => setTimeout(res, ms));

describe('String operations', () => {
  test('concatenates strings', async () => {
    await delay(300);
    expect('hello' + ' ' + 'world').toBe('hello world');
  });

  test('converts to uppercase', async () => {
    await delay(500);
    expect('hello'.toUpperCase()).toBe('HELLO');
  });

  test('trims whitespace', async () => {
    await delay(800);
    expect('  hello  '.trim()).toBe('hello');
  });

  test('checks string length', async () => {
    await delay(400);
    expect('jest'.length).toBe(4);
  });

  test('intentional failure - wrong expectation', async () => {
    await delay(600);
    expect('abc'.length).toBe(99);
  });

  test('splits string into array', async () => {
    await delay(1000);
    expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
  });

  test('replaces substring', async () => {
    await delay(700);
    expect('hello world'.replace('world', 'jest')).toBe('hello jest');
  });
});
