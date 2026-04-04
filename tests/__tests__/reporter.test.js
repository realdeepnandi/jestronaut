import { jest } from '@jest/globals';
import { createState, resetState } from 'jestronaut/lib/state.js';

// Mock createApp so the reporter doesn't try to render an ink TUI in tests
const mockStore = {
  state: createState(),
  notify: jest.fn(),
  reset: jest.fn(function() { resetState(this.state); this.notify(); }),
  on: jest.fn(),
  off: jest.fn(),
};

jest.unstable_mockModule('jestronaut/lib/ui/app.js', () => ({
  createApp: () => ({ store: mockStore, unmount: jest.fn() }),
}));

jest.unstable_mockModule('jestronaut/lib/ui/components/SuiteDetailOverlay.js', () => ({
  buildSuiteDetailItems: jest.fn(() => ({ items: [], name: 'test', hasFailed: false, label: '' })),
  moveCursor: jest.fn(),
  SuiteDetailOverlay: jest.fn(),
}));

const { default: DashboardReporter } = await import('jestronaut/lib/reporter.js');

function makeGlobalConfig(overrides = {}) {
  return { watch: false, watchAll: false, ...overrides };
}

function makeReporter(configOverrides = {}) {
  delete global.__jestronaut_ui__;
  mockStore.state = createState();
  mockStore.notify.mockClear();
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

// ─── onRunStart ───────────────────────────────────────────────────────────────

describe('onRunStart', () => {
  it('resets state and records suite count', () => {
    const reporter = makeReporter();
    reporter._state.stats.passed = 99;
    reporter._state.resultItems = [{ icon: 'PASS' }];

    reporter.onRunStart({ numTotalTestSuites: 3 });

    expect(reporter._state.stats.passed).toBe(0);
    expect(reporter._state.resultItems).toEqual([]);
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

// ─── onTestCaseStart ─────────────────────────────────────────────────────────

describe('onTestCaseStart', () => {
  it('adds the test name to suite.running', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);

    reporter.onTestCaseStart(test, { fullName: 'Suite > my test', title: 'my test' });

    expect(reporter._state.suites[test.path].running.has('Suite > my test')).toBe(true);
  });

  it('removes the name from running when the test case result arrives', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);
    reporter.onTestCaseStart(test, { fullName: 'Suite > my test', title: 'my test' });

    reporter.onTestCaseResult(test, makeTestCaseResult({ fullName: 'Suite > my test', title: 'my test' }));

    expect(reporter._state.suites[test.path].running.has('Suite > my test')).toBe(false);
  });
});

// ─── onTestCaseResult — passed ───────────────────────────────────────────────

describe('onTestCaseResult (passed)', () => {
  it('increments passed count and pushes a result item', () => {
    const reporter = makeReporter();
    const test = makeTest();
    reporter.onTestFileStart(test);

    reporter.onTestCaseResult(test, makeTestCaseResult({ status: 'passed' }));

    const s = reporter._state;
    expect(s.stats.passed).toBe(1);
    expect(s.stats.total).toBe(1);
    expect(s.resultItems).toHaveLength(1);
    expect(s.resultItems[0].icon).toBe('PASS');
    expect(s.resultMeta[0]).toEqual({ status: 'passed', failureIndex: -1 });
  });
});

// ─── onTestCaseResult — failed ───────────────────────────────────────────────

describe('onTestCaseResult (failed)', () => {
  it('increments failed count, stores failure object, marks isFailed', () => {
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
    expect(s.resultItems[0].isFailed).toBe(true);
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
  it('sets runComplete and runOk', () => {
    const reporter = makeReporter();
    reporter.onRunComplete({}, { numFailedTests: 0 });
    expect(reporter._state.runComplete).toBe(true);
    expect(reporter._state.runOk).toBe(true);
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
