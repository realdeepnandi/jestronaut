'use strict';

const {
  buildSuiteDetailLines,
  moveCursor,
} = require('jestronaut/lib/ui/overlays/suiteDetail');

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

// ─── buildSuiteDetailLines ───────────────────────────────────────────────────

describe('buildSuiteDetailLines', () => {
  it('uses the filename (without extension) as suite name', () => {
    const { name } = buildSuiteDetailLines(makeSuite(), PATH);
    expect(name).toBe('math');
  });

  it('shows RUNNING status when suite is not done', () => {
    const { lines } = buildSuiteDetailLines(makeSuite({ done: false }), PATH);
    expect(lines[0]).toContain('RUNNING');
  });

  it('shows PASSED status when suite is done with no failures', () => {
    const suite = makeSuite({ done: true, passed: 2, failed: 0 });
    const { lines } = buildSuiteDetailLines(suite, PATH);
    expect(lines[0]).toContain('PASSED');
  });

  it('shows FAILED status when suite has failures', () => {
    const suite = makeSuite({ done: true, passed: 1, failed: 1 });
    const { lines } = buildSuiteDetailLines(suite, PATH);
    expect(lines[0]).toContain('FAILED');
  });

  it('sets hasFailed correctly', () => {
    expect(buildSuiteDetailLines(makeSuite({ failed: 0 }), PATH).hasFailed).toBe(false);
    expect(buildSuiteDetailLines(makeSuite({ failed: 1 }), PATH).hasFailed).toBe(true);
  });

  it('shows duration when suite is done', () => {
    const suite = makeSuite({ done: true, startTime: 1000, endTime: 2500 });
    const { lines } = buildSuiteDetailLines(suite, PATH);
    const durationLine = lines.find(l => l.includes('Duration'));
    expect(durationLine).toContain('1.50s');
  });

  it('shows "running..." for duration when suite is not done', () => {
    const suite = makeSuite({ done: false, endTime: null });
    const { lines } = buildSuiteDetailLines(suite, PATH);
    const durationLine = lines.find(l => l.includes('Duration'));
    expect(durationLine).toContain('running...');
  });

  it('includes a meta entry with type=test for each test', () => {
    const suite = makeSuite({
      done: true, passed: 1, failed: 1,
      tests: [
        { title: 'ok', status: 'passed', duration: 10, messages: [] },
        { title: 'nope', status: 'failed', duration: 20, messages: ['boom'] },
      ],
    });
    const { meta } = buildSuiteDetailLines(suite, PATH);
    const testMeta = meta.filter(m => m.type === 'test');
    expect(testMeta).toHaveLength(2);
    expect(testMeta[0].failureObj).toBeNull();
    expect(testMeta[1].failureObj).not.toBeNull();
    expect(testMeta[1].failureObj.messages).toEqual(['boom']);
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
    const { lines } = buildSuiteDetailLines(suite, PATH);
    const rateLine = lines.find(l => l.includes('Pass rate'));
    expect(rateLine).toContain('75%');
  });

  it('renders skipped tests with SKIP label and no failureObj', () => {
    const suite = makeSuite({
      done: true, passed: 0, failed: 0,
      tests: [{ title: 'pending test', status: 'skipped', duration: null, messages: [] }],
    });
    const { lines, meta } = buildSuiteDetailLines(suite, PATH);
    const testLine = lines.find(l => l.includes('pending test'));
    expect(testLine).toContain('SKIP');
    const testMeta = meta.filter(m => m.type === 'test');
    expect(testMeta[0].failureObj).toBeNull();
  });

  it('returns "(no results yet)" when tests array is empty', () => {
    const { lines } = buildSuiteDetailLines(makeSuite(), PATH);
    expect(lines.some(l => l.includes('no results yet'))).toBe(true);
  });

  it('label contains pass and fail counts', () => {
    const suite = makeSuite({ passed: 4, failed: 2 });
    const { label } = buildSuiteDetailLines(suite, PATH);
    expect(label).toContain('4p');
    expect(label).toContain('2f');
  });
});

// ─── moveCursor ──────────────────────────────────────────────────────────────

describe('moveCursor', () => {
  function stateWithFailuresAt(indices, total = 6) {
    // Build a meta array where specified indices are failed tests
    const suiteDetailMeta = Array.from({ length: total }, (_, i) => {
      if (indices.includes(i)) {
        return { type: 'test', failureObj: { title: `fail-${i}` } };
      }
      return { type: 'other' };
    });
    return { suiteDetailMeta, suiteDetailCursor: indices[0] ?? 0 };
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
    const state = { suiteDetailMeta: [{ type: 'other' }], suiteDetailCursor: 0 };
    moveCursor(state, 1);
    expect(state.suiteDetailCursor).toBe(0);
  });

  it('does nothing when meta is empty', () => {
    const state = { suiteDetailMeta: [], suiteDetailCursor: 0 };
    moveCursor(state, 1);
    expect(state.suiteDetailCursor).toBe(0);
  });
});
