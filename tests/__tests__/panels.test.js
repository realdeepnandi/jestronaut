'use strict';

const { updateHeader } = require('jestronaut/lib/ui/panels/header');
const { updateStats } = require('jestronaut/lib/ui/panels/stats');
const { updateProgress } = require('jestronaut/lib/ui/panels/progress');
const { updateFooter } = require('jestronaut/lib/ui/panels/footer');
const { refreshResults, updateBorder: updateResultsBorder } = require('jestronaut/lib/ui/panels/results');
const { refreshSuiteDetail } = require('jestronaut/lib/ui/overlays/suiteDetail');

function makeWidget() {
  return {
    setContent: jest.fn(),
    setItems: jest.fn(),
    setLabel: jest.fn(),
    select: jest.fn(),
    scrollTo: jest.fn(),
    style: { border: { fg: 'white' } },
  };
}

function makeStats(overrides = {}) {
  return {
    passed: 0, failed: 0, skipped: 0, total: 0,
    suites: 4, suitesCompleted: 2,
    startTime: Date.now() - 2000,
    endTime: null,
    ...overrides,
  };
}

// ─── updateHeader ─────────────────────────────────────────────────────────────

describe('updateHeader', () => {
  it('sets bg to green and mentions ALL TESTS PASSED when ok', () => {
    const widget = makeWidget();
    widget.style = { bg: 'blue' };
    updateHeader(widget, true);
    expect(widget.style.bg).toBe('green');
    expect(widget.setContent.mock.calls[0][0]).toContain('ALL TESTS PASSED');
  });

  it('sets bg to red and mentions SOME TESTS FAILED when not ok', () => {
    const widget = makeWidget();
    widget.style = { bg: 'blue' };
    updateHeader(widget, false);
    expect(widget.style.bg).toBe('red');
    expect(widget.setContent.mock.calls[0][0]).toContain('SOME TESTS FAILED');
  });
});

// ─── updateStats ──────────────────────────────────────────────────────────────

describe('updateStats', () => {
  it('includes passed, failed, skipped, total counts', () => {
    const widget = makeWidget();
    updateStats(widget, makeStats({ passed: 5, failed: 2, skipped: 1, total: 8 }));
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('5');
    expect(content).toContain('2');
    expect(content).toContain('1');
    expect(content).toContain('8');
  });
});

// ─── updateProgress ───────────────────────────────────────────────────────────

describe('updateProgress', () => {
  it('shows 0% when no suites completed', () => {
    const widget = makeWidget();
    updateProgress(widget, makeStats({ suites: 4, suitesCompleted: 0 }), 80);
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('0%');
  });

  it('shows 100% when all suites completed', () => {
    const widget = makeWidget();
    updateProgress(widget, makeStats({ suites: 4, suitesCompleted: 4 }), 80);
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('100%');
  });

  it('shows 50% at halfway', () => {
    const widget = makeWidget();
    updateProgress(widget, makeStats({ suites: 4, suitesCompleted: 2 }), 80);
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('50%');
  });

  it('uses green bar when no failures', () => {
    const widget = makeWidget();
    updateProgress(widget, makeStats({ failed: 0 }), 80);
    expect(widget.setContent.mock.calls[0][0]).toContain('{green-fg}');
  });

  it('uses red bar when there are failures', () => {
    const widget = makeWidget();
    updateProgress(widget, makeStats({ failed: 1 }), 80);
    expect(widget.setContent.mock.calls[0][0]).toContain('{red-fg}');
  });

  it('never exceeds 100%', () => {
    const widget = makeWidget();
    updateProgress(widget, makeStats({ suites: 2, suitesCompleted: 999 }), 80);
    expect(widget.setContent.mock.calls[0][0]).toContain('100%');
  });
});

// ─── updateFooter / _getHint ─────────────────────────────────────────────────

describe('updateFooter hints', () => {
  function makeState(overrides = {}) {
    return {
      stats: makeStats(),
      suites: {},
      spinFrame: 0,
      focus: 'results',
      testDetailOpen: false,
      suiteDetailOpen: false,
      watchWaiting: false,
      ...overrides,
    };
  }

  it('shows scroll hint when testDetail is open', () => {
    const widget = makeWidget();
    updateFooter(widget, makeState({ testDetailOpen: true }));
    expect(widget.setContent.mock.calls[0][0]).toContain('scroll');
  });

  it('shows navigate/open/back hints when suiteDetail is open', () => {
    const widget = makeWidget();
    updateFooter(widget, makeState({ suiteDetailOpen: true }));
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('navigate failed tests');
    expect(content).toContain('open failure');
    expect(content).toContain('back');
  });

  it('shows watch hint when watchWaiting', () => {
    const widget = makeWidget();
    updateFooter(widget, makeState({ watchWaiting: true }));
    expect(widget.setContent.mock.calls[0][0]).toContain('run all tests');
  });

  it('shows open failure hint when focus is results', () => {
    const widget = makeWidget();
    updateFooter(widget, makeState({ focus: 'results' }));
    expect(widget.setContent.mock.calls[0][0]).toContain('open failure');
  });

  it('shows open suite hint when focus is suites', () => {
    const widget = makeWidget();
    updateFooter(widget, makeState({ focus: 'suites' }));
    expect(widget.setContent.mock.calls[0][0]).toContain('open suite');
  });

  it('shows running count when suites are still running', () => {
    const widget = makeWidget();
    const state = makeState({
      suites: {
        '/a.test.js': { done: false },
        '/b.test.js': { done: true },
      },
    });
    updateFooter(widget, state);
    expect(widget.setContent.mock.calls[0][0]).toContain('1 running');
  });
});

// ─── refreshResults ───────────────────────────────────────────────────────────

describe('refreshResults', () => {
  function makeState(overrides = {}) {
    return {
      resultLines: ['line1', 'line2'],
      resultCursor: -1,
      focus: 'results',
      suiteDetailOpen: false,
      testDetailOpen: false,
      ...overrides,
    };
  }

  it('always calls setItems with resultLines', () => {
    const widget = makeWidget();
    const state = makeState();
    refreshResults(widget, state);
    expect(widget.setItems).toHaveBeenCalledWith(state.resultLines);
  });

  it('selects the cursor when focused and cursor >= 0 and no overlay', () => {
    const widget = makeWidget();
    refreshResults(widget, makeState({ resultCursor: 1 }));
    expect(widget.select).toHaveBeenCalledWith(1);
    expect(widget.scrollTo).toHaveBeenCalledWith(1);
  });

  it('deselects when cursor is -1', () => {
    const widget = makeWidget();
    refreshResults(widget, makeState({ resultCursor: -1 }));
    expect(widget.select).toHaveBeenCalledWith(-1);
  });

  it('deselects when suiteDetail overlay is open', () => {
    const widget = makeWidget();
    refreshResults(widget, makeState({ resultCursor: 1, suiteDetailOpen: true }));
    expect(widget.select).toHaveBeenCalledWith(-1);
  });

  it('deselects when testDetail overlay is open', () => {
    const widget = makeWidget();
    refreshResults(widget, makeState({ resultCursor: 1, testDetailOpen: true }));
    expect(widget.select).toHaveBeenCalledWith(-1);
  });

  it('deselects when focus is not results', () => {
    const widget = makeWidget();
    refreshResults(widget, makeState({ resultCursor: 1, focus: 'suites' }));
    expect(widget.select).toHaveBeenCalledWith(-1);
  });
});

// ─── updateResultsBorder ─────────────────────────────────────────────────────

describe('updateResultsBorder', () => {
  it('sets border to white and label to FOCUSED when focused', () => {
    const widget = makeWidget();
    updateResultsBorder(widget, true);
    expect(widget.style.border.fg).toBe('white');
    expect(widget.setLabel).toHaveBeenCalledWith(expect.stringContaining('FOCUSED'));
  });

  it('resets border to cyan and removes FOCUSED label when not focused', () => {
    const widget = makeWidget();
    updateResultsBorder(widget, false);
    expect(widget.style.border.fg).toBe('cyan');
    expect(widget.setLabel).toHaveBeenCalledWith(expect.not.stringContaining('FOCUSED'));
  });
});

// ─── refreshSuiteDetail ──────────────────────────────────────────────────────

describe('refreshSuiteDetail', () => {
  function makeState(overrides = {}) {
    return {
      suiteDetailLines: ['header', 'pass test', 'fail test', 'footer'],
      suiteDetailMeta: [
        { type: 'other' },
        { type: 'test', failureObj: null },
        { type: 'test', failureObj: { title: 'fail test' } },
        { type: 'other' },
      ],
      suiteDetailCursor: 2,
      ...overrides,
    };
  }

  it('calls setItems with the same number of lines', () => {
    const widget = makeWidget();
    refreshSuiteDetail(widget, makeState());
    expect(widget.setItems).toHaveBeenCalledWith(expect.arrayContaining([expect.any(String)]));
    expect(widget.setItems.mock.calls[0][0]).toHaveLength(4);
  });

  it('highlights the cursor line when it is a failed test', () => {
    const widget = makeWidget();
    refreshSuiteDetail(widget, makeState({ suiteDetailCursor: 2 }));
    const items = widget.setItems.mock.calls[0][0];
    expect(items[2]).toContain('{#3a0a0a-bg}');
    expect(items[2]).toContain('>');
  });

  it('does not highlight non-failure lines', () => {
    const widget = makeWidget();
    refreshSuiteDetail(widget, makeState());
    const items = widget.setItems.mock.calls[0][0];
    expect(items[0]).not.toContain('{#3a0a0a-bg}');
    expect(items[1]).not.toContain('{#3a0a0a-bg}');
  });

  it('scrolls to the cursor position', () => {
    const widget = makeWidget();
    refreshSuiteDetail(widget, makeState({ suiteDetailCursor: 2 }));
    expect(widget.scrollTo).toHaveBeenCalledWith(2);
  });
});
