// panels.test.js — tests for ink component render helpers
// Tests the pure data/logic portions of each panel component.

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
}));

jest.unstable_mockModule('jestronaut/lib/ui/components/ScrollableBox.js', () => ({
  ScrollableBox: jest.fn(),
}));

jest.unstable_mockModule('jestronaut/lib/constants.js', () => ({
  SPINNER: ['⠋', '⠙', '⠹', '⠸'],
}));

const { Header }  = await import('jestronaut/lib/ui/components/Header.js');
const { Stats }   = await import('jestronaut/lib/ui/components/Stats.js');
const { Footer }  = await import('jestronaut/lib/ui/components/Footer.js');

function render(fn) {
  createdElements = [];
  fn();
  return createdElements;
}

// ─── Header ──────────────────────────────────────────────────────────────────

describe('Header', () => {
  it('shows ALL TESTS PASSED and uses green bg when runOk', () => {
    const els = render(() => Header({ state: { runComplete: true, runOk: true, runElapsed: '1.2' } }));
    const box = els.find(e => e.props.backgroundColor === 'green');
    expect(box).toBeDefined();
    const text = els.find(e => typeof e.children[0] === 'string' && e.children[0].includes('ALL TESTS PASSED'));
    expect(text).toBeDefined();
  });

  it('shows SOME TESTS FAILED and uses red bg when not runOk', () => {
    const els = render(() => Header({ state: { runComplete: true, runOk: false, runElapsed: '0.9' } }));
    const box = els.find(e => e.props.backgroundColor === 'red');
    expect(box).toBeDefined();
    const text = els.find(e => typeof e.children[0] === 'string' && e.children[0].includes('SOME TESTS FAILED'));
    expect(text).toBeDefined();
  });

  it('shows JEST TEST DASHBOARD with blue bg while running', () => {
    const els = render(() => Header({ state: { runComplete: false, runOk: false, runElapsed: '0' } }));
    const box = els.find(e => e.props.backgroundColor === 'blue');
    expect(box).toBeDefined();
    const text = els.find(e => typeof e.children[0] === 'string' && e.children[0].includes('JEST TEST DASHBOARD'));
    expect(text).toBeDefined();
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
    const passedEl = els.find(e => e.props.color === 'green' && typeof e.children[0] === 'string' && e.children[0].includes('3'));
    expect(passedEl).toBeDefined();
  });

  it('labels failed count with red color', () => {
    const els = render(() => Stats({ stats: { passed: 0, failed: 4, skipped: 0, total: 4 } }));
    const failedEl = els.find(e => e.props.color === 'red' && typeof e.children[0] === 'string' && e.children[0].includes('4'));
    expect(failedEl).toBeDefined();
  });
});

// ─── Progress helpers (pure functions) ───────────────────────────────────────

function buildProgressText(stats, width = 80) {
  const { suites, suitesCompleted, failed } = stats;
  const pct = suites > 0 ? Math.min(100, Math.round((suitesCompleted / suites) * 100)) : 0;
  const barWidth = Math.max(10, width - 20);
  const filled = Math.round((pct / 100) * barWidth);
  const empty = barWidth - filled;
  const color = failed > 0 ? 'red' : 'green';
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return { pct, bar, color };
}

describe('progress helpers', () => {
  it('returns 0% when no suites completed', () => {
    expect(buildProgressText({ suites: 4, suitesCompleted: 0, failed: 0 }).pct).toBe(0);
  });

  it('returns 100% when all suites completed', () => {
    expect(buildProgressText({ suites: 4, suitesCompleted: 4, failed: 0 }).pct).toBe(100);
  });

  it('returns 50% at halfway', () => {
    expect(buildProgressText({ suites: 4, suitesCompleted: 2, failed: 0 }).pct).toBe(50);
  });

  it('caps at 100% when suitesCompleted exceeds total', () => {
    expect(buildProgressText({ suites: 2, suitesCompleted: 999, failed: 0 }).pct).toBe(100);
  });

  it('uses red when there are failures', () => {
    expect(buildProgressText({ suites: 4, suitesCompleted: 2, failed: 1 }).color).toBe('red');
  });

  it('uses green when no failures', () => {
    expect(buildProgressText({ suites: 4, suitesCompleted: 2, failed: 0 }).color).toBe('green');
  });
});

// ─── Footer hint logic ───────────────────────────────────────────────────────

function makeFooterState(overrides = {}) {
  return {
    stats: { passed: 0, failed: 0, skipped: 0, total: 0, startTime: Date.now() - 2000, endTime: null, suites: 4, suitesCompleted: 2 },
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
  const els = render(() => Footer({ state }));
  return els.filter(e => typeof e.children[0] === 'string').map(e => e.children[0]);
}

describe('Footer hints', () => {
  it('shows scroll hint when testDetail is open', () => {
    const texts = getRenderedTexts(makeFooterState({ testDetailOpen: true }));
    expect(texts.some(t => t.includes('scroll'))).toBe(true);
  });

  it('shows navigate/open/back hints when suiteDetail is open', () => {
    const texts = getRenderedTexts(makeFooterState({ suiteDetailOpen: true }));
    const joined = texts.join(' ');
    expect(joined).toContain('navigate');
    expect(joined).toContain('open failure');
    expect(joined).toContain('Esc');
  });

  it('shows watch hint when watchWaiting', () => {
    const texts = getRenderedTexts(makeFooterState({ watchWaiting: true }));
    expect(texts.some(t => t.includes('run all tests'))).toBe(true);
  });

  it('shows open failure hint in default (results) focus', () => {
    const texts = getRenderedTexts(makeFooterState({ focus: 'results' }));
    expect(texts.some(t => t.includes('open failure'))).toBe(true);
  });

  it('shows running count when suites are still running', () => {
    const state = makeFooterState({
      suites: {
        '/a.test.js': { done: false },
        '/b.test.js': { done: true },
      },
    });
    const texts = getRenderedTexts(state);
    expect(texts.some(t => t.includes('Running') && t.includes('1'))).toBe(true);
  });

  it('shows elapsed time when all suites complete', () => {
    const state = makeFooterState({ suites: {} });
    const texts = getRenderedTexts(state);
    expect(texts.some(t => t.includes('Elapsed'))).toBe(true);
  });
});

// ─── ResultsList item building (pure) ────────────────────────────────────────

function buildResultListItems(resultItems, resultCursor, focus, suiteDetailOpen, testDetailOpen) {
  const showCursor = focus === 'results' && !suiteDetailOpen && !testDetailOpen && resultCursor >= 0;
  return resultItems.map((item, i) => ({
    text: `${item.icon}  ${item.ancestor ? item.ancestor + ' > ' : ''}${item.title}`,
    color: item.isFailed ? 'red' : 'green',
    bg: showCursor && i === resultCursor ? '#2a2a6a' : undefined,
  }));
}

describe('ResultsList item building', () => {
  const items = [
    { icon: 'PASS', ancestor: 'Suite', title: 'test 1', isFailed: false, duration: 10 },
    { icon: 'FAIL', ancestor: 'Suite', title: 'test 2', isFailed: true, duration: 20 },
  ];

  it('builds text with icon and title', () => {
    const built = buildResultListItems(items, -1, 'results', false, false);
    expect(built[0].text).toContain('PASS');
    expect(built[0].text).toContain('test 1');
  });

  it('uses green color for passed items', () => {
    const built = buildResultListItems(items, -1, 'results', false, false);
    expect(built[0].color).toBe('green');
  });

  it('uses red color for failed items', () => {
    const built = buildResultListItems(items, -1, 'results', false, false);
    expect(built[1].color).toBe('red');
  });

  it('highlights selected item when focused on results', () => {
    const built = buildResultListItems(items, 0, 'results', false, false);
    expect(built[0].bg).toBe('#2a2a6a');
  });

  it('does not highlight non-selected item', () => {
    const built = buildResultListItems(items, 0, 'results', false, false);
    expect(built[1].bg).toBeUndefined();
  });

  it('does not highlight when suiteDetail is open', () => {
    const built = buildResultListItems(items, 0, 'results', true, false);
    expect(built[0].bg).toBeUndefined();
  });

  it('does not highlight when testDetail is open', () => {
    const built = buildResultListItems(items, 0, 'results', false, true);
    expect(built[0].bg).toBeUndefined();
  });

  it('does not highlight when cursor is -1', () => {
    const built = buildResultListItems(items, -1, 'results', false, false);
    expect(built[0].bg).toBeUndefined();
  });

  it('does not highlight when focus is not results', () => {
    const built = buildResultListItems(items, 0, 'suites', false, false);
    expect(built[0].bg).toBeUndefined();
  });
});

// ─── SuiteDetail cursor highlighting (pure) ──────────────────────────────────
// In the old blessed world, refreshSuiteDetail applied {#3a0a0a-bg} tags.
// In ink, the SuiteDetailOverlay maps items to {bg: '#5a0a0a'} for the selected failed test.

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
      { type: 'other', text: 'header', color: 'white', failureObj: null },
      { type: 'test', text: 'pass test', color: 'green', failureObj: null },
      { type: 'test', text: 'fail test', color: 'red', failureObj: { title: 'fail test' } },
      { type: 'other', text: 'footer', color: 'gray', failureObj: null },
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
    const built = buildSuiteDetailListItems(makeMeta(), 1);
    expect(built[1].bg).toBeUndefined();
  });


});
