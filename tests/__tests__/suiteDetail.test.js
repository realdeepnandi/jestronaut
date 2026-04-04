import { jest } from '@jest/globals';

jest.unstable_mockModule('ink', () => ({
  Box: jest.fn(),
  Text: jest.fn(),
}));

jest.unstable_mockModule('react', () => ({
  default: { createElement: jest.fn() },
}));

jest.unstable_mockModule('jestronaut/lib/ui/components/ScrollableList.js', () => ({
  ScrollableList: jest.fn(),
}));

const { buildSuiteDetailItems, moveCursor } = await import('jestronaut/lib/ui/components/SuiteDetailOverlay.js');

function makeSuite(overrides = {}) {
  return {
    passed: 0,
    failed: 0,
    done: false,
    startTime: 1000,
    endTime: null,
    running: new Set(),
    tests: [],
    ...overrides,
  };
}

const PATH = '/project/src/math.test.js';

// ─── buildSuiteDetailItems ───────────────────────────────────────────────────

describe('buildSuiteDetailItems', () => {
  it('uses the filename (without extension) as suite name', () => {
    const { name } = buildSuiteDetailItems(makeSuite(), PATH);
    expect(name).toBe('math');
  });

  it('shows RUNNING status when suite is not done', () => {
    const { items } = buildSuiteDetailItems(makeSuite({ done: false }), PATH);
    expect(items[0].text).toContain('RUNNING');
  });

  it('shows PASSED status when suite is done with no failures', () => {
    const suite = makeSuite({ done: true, passed: 2, failed: 0 });
    const { items } = buildSuiteDetailItems(suite, PATH);
    expect(items[0].text).toContain('PASSED');
  });

  it('shows FAILED status when suite has failures', () => {
    const suite = makeSuite({ done: true, passed: 1, failed: 1 });
    const { items } = buildSuiteDetailItems(suite, PATH);
    expect(items[0].text).toContain('FAILED');
  });

  it('sets hasFailed correctly', () => {
    expect(buildSuiteDetailItems(makeSuite({ failed: 0 }), PATH).hasFailed).toBe(false);
    expect(buildSuiteDetailItems(makeSuite({ failed: 1 }), PATH).hasFailed).toBe(true);
  });

  it('shows duration when suite is done', () => {
    const suite = makeSuite({ done: true, startTime: 1000, endTime: 2500 });
    const { items } = buildSuiteDetailItems(suite, PATH);
    const durationItem = items.find(i => i.text.includes('Duration'));
    expect(durationItem.text).toContain('1.50s');
  });

  it('shows "running..." for duration when suite is not done', () => {
    const suite = makeSuite({ done: false, endTime: null });
    const { items } = buildSuiteDetailItems(suite, PATH);
    const durationItem = items.find(i => i.text.includes('Duration'));
    expect(durationItem.text).toContain('running...');
  });

  it('includes an item with type=test for each test', () => {
    const suite = makeSuite({
      done: true, passed: 1, failed: 1,
      tests: [
        { title: 'ok', status: 'passed', duration: 10, messages: [] },
        { title: 'nope', status: 'failed', duration: 20, messages: ['boom'] },
      ],
    });
    const { items } = buildSuiteDetailItems(suite, PATH);
    const testItems = items.filter(m => m.type === 'test');
    expect(testItems).toHaveLength(2);
    expect(testItems[0].failureObj).toBeNull();
    expect(testItems[1].failureObj).not.toBeNull();
    expect(testItems[1].failureObj.messages).toEqual(['boom']);
  });

  it('calculates pass rate correctly', () => {
    const suite = makeSuite({
      done: true, passed: 3, failed: 1,
      tests: [
        { title: 'a', status: 'passed', duration: 1, messages: [] },
        { title: 'b', status: 'passed', duration: 2, messages: [] },
        { title: 'c', status: 'passed', duration: 3, messages: [] },
        { title: 'd', status: 'failed', duration: 4, messages: [] },
      ],
    });
    const { items } = buildSuiteDetailItems(suite, PATH);
    const rateItem = items.find(i => i.text.includes('Pass rate'));
    expect(rateItem.text).toContain('75%');
  });

  it('renders skipped tests with SKIP label and no failureObj', () => {
    const suite = makeSuite({
      done: true, passed: 0, failed: 0,
      tests: [{ title: 'pending test', status: 'skipped', duration: null, messages: [] }],
    });
    const { items } = buildSuiteDetailItems(suite, PATH);
    const testItem = items.find(i => i.text.includes('pending test'));
    expect(testItem.text).toContain('SKIP');
    const testMeta = items.filter(i => i.type === 'test');
    expect(testMeta[0].failureObj).toBeNull();
  });

  it('returns "(no results yet)" when tests array is empty', () => {
    const { items } = buildSuiteDetailItems(makeSuite(), PATH);
    expect(items.some(i => i.text.includes('no results yet'))).toBe(true);
  });

  it('label contains pass and fail counts', () => {
    const suite = makeSuite({ passed: 4, failed: 2 });
    const { label } = buildSuiteDetailItems(suite, PATH);
    expect(label).toContain('4p');
    expect(label).toContain('2f');
  });
});

// ─── moveCursor ──────────────────────────────────────────────────────────────

describe('moveCursor', () => {
  function stateWithFailuresAt(indices, total = 6) {
    const suiteDetailItems = Array.from({ length: total }, (_, i) => {
      if (indices.includes(i)) {
        return { type: 'test', failureObj: { title: `fail-${i}` } };
      }
      return { type: 'other' };
    });
    return { suiteDetailItems, suiteDetailCursor: indices[0] ?? 0 };
  }

  it('moves forward to the next failure', () => {
    const state = stateWithFailuresAt([1, 3, 5]);
    state.suiteDetailCursor = 1;
    moveCursor(state, 1);
    expect(state.suiteDetailCursor).toBe(3);
  });

  it('wraps forward from last failure to first', () => {
    const state = stateWithFailuresAt([1, 3, 5]);
    state.suiteDetailCursor = 5;
    moveCursor(state, 1);
    expect(state.suiteDetailCursor).toBe(1);
  });

  it('moves backward to the previous failure', () => {
    const state = stateWithFailuresAt([1, 3, 5]);
    state.suiteDetailCursor = 3;
    moveCursor(state, -1);
    expect(state.suiteDetailCursor).toBe(1);
  });

  it('wraps backward from first failure to last', () => {
    const state = stateWithFailuresAt([1, 3, 5]);
    state.suiteDetailCursor = 1;
    moveCursor(state, -1);
    expect(state.suiteDetailCursor).toBe(5);
  });

  it('does nothing when there are no failures', () => {
    const state = { suiteDetailItems: [{ type: 'other' }], suiteDetailCursor: 0 };
    moveCursor(state, 1);
    expect(state.suiteDetailCursor).toBe(0);
  });

  it('does nothing when items is empty', () => {
    const state = { suiteDetailItems: [], suiteDetailCursor: 0 };
    moveCursor(state, 1);
    expect(state.suiteDetailCursor).toBe(0);
  });
});
