'use strict';

// blessed is auto-mocked via moduleNameMapper — no terminal I/O occurs.

const DashboardReporter = require('jestronaut/lib/reporter');

function makeGlobalConfig(overrides = {}) {
  return { watch: false, watchAll: false, ...overrides };
}

function makeReporter(configOverrides = {}) {
  // Clear global UI state between tests
  delete global.__jestronaut_ui__;
  delete global.__jestronaut_blessed_listeners__;
  delete global.__jestronaut_block_jest_input__;

  return new DashboardReporter(makeGlobalConfig(configOverrides));
}

function makeTest(path = '/project/foo.test.js') {
  return { path };
}

function makeTestCaseResult(overrides = {}) {
  return {
    title: 'does something',
    fullName: 'Suite > does something',
    ancestorTitles: ['Suite'],
    status: 'passed',
    duration: 42,
    failureMessages: [],
    ...overrides,
  };
}

afterEach(() => {
  const ui = global.__jestronaut_ui__;
  if (ui && ui.state && ui.state._ticker) {
    clearInterval(ui.state._ticker);
    ui.state._ticker = null;
  }
  delete global.__jestronaut_ui__;
  delete global.__jestronaut_blessed_listeners__;
  delete global.__jestronaut_block_jest_input__;
});

// ─── onRunStart ───────────────────────────────────────────────────────────────

describe('onRunStart', () => {
  it('resets state and records suite count', () => {
    const reporter = makeReporter();
    // pre-dirty the state
    reporter._state.stats.passed = 99;
    reporter._state.resultLines = ['stale'];

    reporter.onRunStart({ numTotalTestSuites: 3 });

    expect(reporter._state.stats.passed).toBe(0);
    expect(reporter._state.resultLines).toEqual([]);
    expect(reporter._state.stats.suites).toBe(3);
    expect(reporter._state.watchWaiting).toBe(false);
  });
});

// ─── onTestFileStart ─────────────────────────────────────────────────────────

describe('onTestFileStart', () => {
  it('registers the suite in state', () => {
    const reporter = makeReporter();
    const test = makeTest('/project/math.test.js');

    reporter.onTestFileStart(test);

    expect(reporter._state.suites[test.path]).toBeDefined();
    expect(reporter._state.suiteOrder).toContain(test.path);
    expect(reporter._state.suites[test.path].done).toBe(false);
  });
});

// ─── onTestCaseResult — passed ───────────────────────────────────────────────

describe('onTestCaseResult (passed)', () => {
  it('increments passed count and pushes a result line', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);

    reporter.onTestCaseResult(test, makeTestCaseResult({ status: 'passed' }));

    const s = reporter._state;
    expect(s.stats.passed).toBe(1);
    expect(s.stats.total).toBe(1);
    expect(s.resultLines).toHaveLength(1);
    expect(s.resultLines[0]).toContain('PASS');
    expect(s.resultMeta[0]).toEqual({ status: 'passed', failureIndex: -1 });
  });
});

// ─── onTestCaseResult — failed ───────────────────────────────────────────────

describe('onTestCaseResult (failed)', () => {
  it('increments failed count, stores failure object, and hints Enter', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);

    reporter.onTestCaseResult(test, makeTestCaseResult({
      status: 'failed',
      title: 'blows up',
      ancestorTitles: ['Suite'],
      failureMessages: ['Expected 1 to equal 2'],
    }));

    const s = reporter._state;
    expect(s.stats.failed).toBe(1);
    expect(s.failures).toHaveLength(1);
    expect(s.failures[0].title).toBe('blows up');
    expect(s.failures[0].messages).toEqual(['Expected 1 to equal 2']);
    expect(s.resultMeta[0]).toEqual({ status: 'failed', failureIndex: 0 });
    expect(s.resultLines[0]).toContain('[Enter]');
  });

  it('assigns sequential failureIndex for multiple failures', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);

    reporter.onTestCaseResult(test, makeTestCaseResult({ status: 'failed', title: 'A' }));
    reporter.onTestCaseResult(test, makeTestCaseResult({ status: 'failed', title: 'B' }));

    expect(reporter._state.resultMeta[0].failureIndex).toBe(0);
    expect(reporter._state.resultMeta[1].failureIndex).toBe(1);
  });
});

// ─── onTestCaseResult — skipped ──────────────────────────────────────────────

describe('onTestCaseResult (skipped)', () => {
  it('increments skipped count', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);

    reporter.onTestCaseResult(test, makeTestCaseResult({ status: 'skipped' }));

    const s = reporter._state;
    expect(s.stats.skipped).toBe(1);
    expect(s.resultMeta[0].status).toBe('skipped');
    expect(s.resultMeta[0].failureIndex).toBe(-1);
  });
});

// ─── onTestFileResult ────────────────────────────────────────────────────────

describe('onTestFileResult', () => {
  it('marks suite as done and increments suitesCompleted', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);

    reporter.onTestFileResult(test);

    const suite = reporter._state.suites[test.path];
    expect(suite.done).toBe(true);
    expect(reporter._state.stats.suitesCompleted).toBe(1);
  });
});

// ─── onRunComplete ───────────────────────────────────────────────────────────

describe('onRunComplete', () => {
  it('clears the ticker', () => {
    const reporter = makeReporter();
    reporter._state._ticker = setInterval(() => {}, 9999);

    reporter.onRunComplete({}, { numFailedTests: 0 });

    expect(reporter._state._ticker).toBeNull();
  });

  it('sets watchWaiting when in watch mode', () => {
    const reporter = makeReporter({ watch: true });
    reporter.onRunComplete({}, { numFailedTests: 0 });
    expect(reporter._state.watchWaiting).toBe(true);
  });

  it('records endTime', () => {
    const reporter = makeReporter();
    const before = Date.now();
    reporter.onRunComplete({}, { numFailedTests: 0 });
    expect(reporter._state.stats.endTime).toBeGreaterThanOrEqual(before);
  });
});
