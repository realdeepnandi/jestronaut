import { createState, resetState } from 'jestronaut/lib/state.js';

describe('createState', () => {
  it('returns a fresh state with correct defaults', () => {
    const state = createState();
    expect(state.stats.passed).toBe(0);
    expect(state.stats.failed).toBe(0);
    expect(state.stats.skipped).toBe(0);
    expect(state.stats.total).toBe(0);
    expect(state.resultItems).toEqual([]);
    expect(state.resultMeta).toEqual([]);
    expect(state.failures).toEqual([]);
    expect(state.focus).toBe('results');
    expect(state.resultCursor).toBe(-1);
    expect(state.suiteCursor).toBe(0);
    expect(state.suiteDetailOpen).toBe(false);
    expect(state.testDetailOpen).toBe(false);
    expect(state.watchMode).toBe(false);
    expect(state.watchWaiting).toBe(false);
  });

  it('stats.startTime is set to a recent timestamp', () => {
    const before = Date.now();
    const state = createState();
    const after = Date.now();
    expect(state.stats.startTime).toBeGreaterThanOrEqual(before);
    expect(state.stats.startTime).toBeLessThanOrEqual(after);
  });
});

describe('resetState', () => {
  it('clears accumulated run data', () => {
    const state = createState();
    state.stats.passed = 5;
    state.stats.failed = 2;
    state.resultItems = [{ icon: 'PASS' }];
    state.resultMeta = [{ status: 'passed', failureIndex: -1 }];
    state.failures = [{ title: 'x' }];
    state.suiteDetailOpen = true;
    state.testDetailOpen = true;
    state.spinFrame = 3;

    resetState(state);

    expect(state.stats.passed).toBe(0);
    expect(state.stats.failed).toBe(0);
    expect(state.resultItems).toEqual([]);
    expect(state.resultMeta).toEqual([]);
    expect(state.failures).toEqual([]);
    expect(state.suiteDetailOpen).toBe(false);
    expect(state.testDetailOpen).toBe(false);
    expect(state.spinFrame).toBe(0);
  });

  it('preserves watchMode and watchWaiting across reset', () => {
    const state = createState();
    state.watchMode = true;
    state.watchWaiting = true;

    resetState(state);

    expect(state.watchMode).toBe(true);
    expect(state.watchWaiting).toBe(true);
  });
});
