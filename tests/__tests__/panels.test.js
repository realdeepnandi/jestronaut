// panels.test.js — tests for ink component render helpers

import { jest } from '@jest/globals';

let createdElements = [];

jest.unstable_mockModule('ink', () => ({
  Box: jest.fn(({ children }) => children),
  Text: jest.fn(({ children }) => children),
  useApp: jest.fn(() => ({ exit: jest.fn() })),
  useInput: jest.fn(),
  useStdout: jest.fn(() => ({ stdout: { columns: 80, rows: 24 } })),
}));

jest.unstable_mockModule('react', () => ({
  default: {
    createElement: jest.fn((type, props, ...children) => {
      createdElements.push({ type, props: props || {}, children });
      return null;
    }),
  },
}));

jest.unstable_mockModule('jestronaut/lib/ui/components/ScrollableList.js', () => ({
  ScrollableList: jest.fn(),
  computeScrollOffset: jest.fn(() => 0),
}));

jest.unstable_mockModule('jestronaut/lib/ui/components/ScrollableBox.js', () => ({
  ScrollableBox: jest.fn(),
}));

jest.unstable_mockModule('jestronaut/lib/constants.js', () => ({
  SPINNER: ['⠋', '⠙', '⠹', '⠸'],
}));

const { Header }           = await import('jestronaut/lib/ui/components/Header.js');
const { Stats }            = await import('jestronaut/lib/ui/components/Stats.js');
const { Footer }           = await import('jestronaut/lib/ui/components/Footer.js');
const { buildProgressData } = await import('jestronaut/lib/ui/components/Progress.js');
const { buildItems }        = await import('jestronaut/lib/ui/components/ResultsList.js');

function render(fn) {
  createdElements = [];
  fn();
  return createdElements;
}

// ─── Header ──────────────────────────────────────────────────────────────────

describe('Header', () => {
  it('shows ALL TESTS PASSED and uses green bg when runOk', () => {
    const els = render(() => Header({ state: { runComplete: true, runOk: true, runElapsed: '1.2' } }));
    expect(els.some(e => e.props.backgroundColor === 'green')).toBe(true);
    expect(els.some(e => typeof e.children[0] === 'string' && e.children[0].includes('ALL TESTS PASSED'))).toBe(true);
  });

  it('shows SOME TESTS FAILED and uses red bg when not runOk', () => {
    const els = render(() => Header({ state: { runComplete: true, runOk: false, runElapsed: '0.9' } }));
    expect(els.some(e => e.props.backgroundColor === 'red')).toBe(true);
    expect(els.some(e => typeof e.children[0] === 'string' && e.children[0].includes('SOME TESTS FAILED'))).toBe(true);
  });

  it('shows JEST TEST DASHBOARD with blue bg while running', () => {
    const els = render(() => Header({ state: { runComplete: false, runOk: false, runElapsed: '0' } }));
    expect(els.some(e => e.props.backgroundColor === 'blue')).toBe(true);
    expect(els.some(e => typeof e.children[0] === 'string' && e.children[0].includes('JEST TEST DASHBOARD'))).toBe(true);
  });
});

// ─── Stats ───────────────────────────────────────────────────────────────────

describe('Stats', () => {
  it('includes passed, failed, skipped, total counts in rendered text', () => {
    const els = render(() => Stats({ stats: { passed: 5, failed: 2, skipped: 1, total: 8 } }));
    const texts = els.filter(e => typeof e.children[0] === 'string').map(e => e.children[0]);
    expect(texts.some(t => t.includes('5'))).toBe(true);
    expect(texts.some(t => t.includes('2'))).toBe(true);
    expect(texts.some(t => t.includes('1'))).toBe(true);
    expect(texts.some(t => t.includes('8'))).toBe(true);
  });

  it('labels passed count with green color', () => {
    const els = render(() => Stats({ stats: { passed: 3, failed: 0, skipped: 0, total: 3 } }));
    expect(els.some(e => e.props.color === 'green' && typeof e.children[0] === 'string' && e.children[0].includes('3'))).toBe(true);
  });

  it('labels failed count with red color', () => {
    const els = render(() => Stats({ stats: { passed: 0, failed: 4, skipped: 0, total: 4 } }));
    expect(els.some(e => e.props.color === 'red' && typeof e.children[0] === 'string' && e.children[0].includes('4'))).toBe(true);
  });
});

// ─── Progress (real buildProgressData) ───────────────────────────────────────

describe('buildProgressData', () => {
  function makeStats(overrides = {}) {
    return { suites: 4, suitesCompleted: 0, failed: 0, ...overrides };
  }

  it('returns 0% when no suites completed', () => {
    expect(buildProgressData(makeStats({ suitesCompleted: 0 })).pct).toBe(0);
  });

  it('returns 100% when all suites completed', () => {
    expect(buildProgressData(makeStats({ suitesCompleted: 4 })).pct).toBe(100);
  });

  it('returns 50% at halfway', () => {
    expect(buildProgressData(makeStats({ suitesCompleted: 2 })).pct).toBe(50);
  });

  it('caps bar fill at barWidth when suitesCompleted exceeds suites', () => {
    const { filled, barWidth, bar } = buildProgressData(makeStats({ suites: 2, suitesCompleted: 999 }));
    expect(filled).toBeLessThanOrEqual(barWidth);
    expect(bar.length).toBe(barWidth);
  });

  it('uses red color when there are failures', () => {
    expect(buildProgressData(makeStats({ failed: 1 })).color).toBe('red');
  });

  it('uses green color when all suites done with no failures', () => {
    expect(buildProgressData(makeStats({ suitesCompleted: 4, failed: 0 })).color).toBe('green');
  });

  it('uses # and - characters for fill and empty', () => {
    const { bar, filled, empty } = buildProgressData(makeStats({ suitesCompleted: 2 }));
    expect(bar).toMatch(/^#+\-+$/);
    expect(bar.split('#').length - 1).toBe(filled);
    expect(bar.split('-').length - 1).toBe(empty);
  });
});

// ─── Footer hints ────────────────────────────────────────────────────────────

function makeFooterState(overrides = {}) {
  return {
    stats: { passed: 0, failed: 0, skipped: 0, total: 0, startTime: Date.now() - 2000, endTime: null },
    spinFrame: 0,
    focus: 'results',
    testDetailOpen: false,
    suiteDetailOpen: false,
    watchWaiting: false,
    suites: {},
    ...overrides,
  };
}

function getRenderedTexts(state) {
  const els = render(() => Footer({ state, width: 80 }));
  return els.filter(e => typeof e.children[0] === 'string').map(e => e.children[0]);
}

describe('Footer hints', () => {
  it('shows scroll hint when testDetail is open', () => {
    expect(getRenderedTexts(makeFooterState({ testDetailOpen: true })).some(t => t.includes('scroll'))).toBe(true);
  });

  it('shows navigate/open/back hints when suiteDetail is open', () => {
    const joined = getRenderedTexts(makeFooterState({ suiteDetailOpen: true })).join(' ');
    expect(joined).toContain('navigate');
    expect(joined).toContain('open failure');
    expect(joined).toContain('Esc');
  });

  it('shows watch hint when watchWaiting', () => {
    expect(getRenderedTexts(makeFooterState({ watchWaiting: true })).some(t => t.includes('run all'))).toBe(true);
  });

  it('shows re-run failed hint when watchWaiting and there are failures', () => {
    const state = makeFooterState({ watchWaiting: true });
    state.stats.failed = 2;
    expect(getRenderedTexts(state).some(t => t.includes('re-run failed'))).toBe(true);
  });

  it('hides re-run failed hint when watchWaiting but no failures', () => {
    expect(getRenderedTexts(makeFooterState({ watchWaiting: true })).some(t => t.includes('re-run failed'))).toBe(false);
  });

  it('shows open hint in default (results) focus', () => {
    expect(getRenderedTexts(makeFooterState({ focus: 'results' })).some(t => t.includes('[Enter] open'))).toBe(true);
  });

  it('shows help hint in default state', () => {
    const texts = getRenderedTexts(makeFooterState());
    expect(texts.some(t => t.includes('?') && t.includes('help'))).toBe(true);
  });

  it('shows running count when suites are still running', () => {
    const state = makeFooterState({ suites: { '/a.test.js': { done: false }, '/b.test.js': { done: true } } });
    expect(getRenderedTexts(state).some(t => t.includes('Running') && t.includes('1'))).toBe(true);
  });

  it('shows elapsed time when no suites are running', () => {
    expect(getRenderedTexts(makeFooterState({ suites: {} })).some(t => t.includes('Elapsed'))).toBe(true);
  });
});

// ─── ResultsList buildItems (real function) ───────────────────────────────────

describe('buildItems', () => {
  const resultItems = [
    { icon: 'PASS', ancestor: 'Suite', title: 'test 1', titleColor: 'white', duration: 10, isFailed: false },
    { icon: 'FAIL', ancestor: 'Suite', title: 'test 2', titleColor: 'red',   duration: 20, isFailed: true  },
    { icon: 'SKIP', ancestor: '',      title: 'test 3', titleColor: 'yellow',duration: null, isFailed: false },
  ];

  it('formats text as [ICON] ancestor > title (Xms)', () => {
    const items = buildItems(resultItems);
    expect(items[0].text).toMatch(/\[PASS\].*Suite.*test 1.*10ms/);
  });

  it('appends [Enter] hint for failed items', () => {
    const items = buildItems(resultItems);
    expect(items[1].text).toContain('[Enter]');
    expect(items[0].text).not.toContain('[Enter]');
  });

  it('omits duration when null', () => {
    const items = buildItems(resultItems);
    expect(items[2].text).not.toContain('ms');
  });

  it('omits ancestor separator when ancestor is empty', () => {
    const items = buildItems(resultItems);
    expect(items[2].text).not.toContain('>');
  });

  it('sets color from titleColor', () => {
    const items = buildItems(resultItems);
    expect(items[0].color).toBe('white');
    expect(items[1].color).toBe('red');
  });
});

// ─── SuiteDetail cursor highlighting (pure) ──────────────────────────────────

function buildSuiteDetailListItems(suiteDetailItems, suiteDetailCursor) {
  return suiteDetailItems.map((item, i) => {
    const isSelected = i === suiteDetailCursor && item.type === 'test' && item.failureObj;
    return {
      text: isSelected ? `> ${item.text.trimStart()}` : `  ${item.text}`,
      color: item.color,
      bg: isSelected ? '#5a0a0a' : undefined,
    };
  });
}

describe('SuiteDetail cursor highlighting', () => {
  function makeMeta() {
    return [
      { type: 'other', text: 'header',    color: 'white', failureObj: null },
      { type: 'test',  text: 'pass test', color: 'green', failureObj: null },
      { type: 'test',  text: 'fail test', color: 'red',   failureObj: { title: 'fail test' } },
      { type: 'other', text: 'footer',    color: 'gray',  failureObj: null },
    ];
  }

  it('highlights the cursor line when it is a failed test', () => {
    const built = buildSuiteDetailListItems(makeMeta(), 2);
    expect(built[2].bg).toBe('#5a0a0a');
    expect(built[2].text).toContain('>');
  });

  it('does not highlight non-failure lines', () => {
    const built = buildSuiteDetailListItems(makeMeta(), 2);
    expect(built[0].bg).toBeUndefined();
    expect(built[1].bg).toBeUndefined();
  });

  it('does not highlight a passing test even if cursor is on it', () => {
    expect(buildSuiteDetailListItems(makeMeta(), 1)[1].bg).toBeUndefined();
  });
});
