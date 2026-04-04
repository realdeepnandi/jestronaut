import { jest } from '@jest/globals';

// Capture lines passed to ScrollableBox so we can assert on them
let capturedLines = [];

jest.unstable_mockModule('ink', () => ({
  Box: jest.fn(),
}));

jest.unstable_mockModule('react', () => ({
  default: {
    createElement: jest.fn((type, props, ...children) => {
      // Capture the lines prop when ScrollableBox is rendered
      if (props && props.lines) capturedLines = props.lines;
      return null;
    }),
  },
}));

jest.unstable_mockModule('jestronaut/lib/ui/components/ScrollableBox.js', () => ({
  ScrollableBox: jest.fn(),
}));

const { TestDetailOverlay } = await import('jestronaut/lib/ui/components/TestDetailOverlay.js');

function makeFailure(overrides = {}) {
  return {
    title: 'adds numbers',
    suiteName: 'Math',
    messages: [],
    duration: 50,
    ...overrides,
  };
}

function makeStats(overrides = {}) {
  return { passed: 3, failed: 1, skipped: 0, startTime: Date.now() - 1000, endTime: Date.now(), ...overrides };
}

function render(failure, stats) {
  capturedLines = [];
  const state = {
    testDetailFailure: failure,
    testDetailScrollOffset: 0,
    stats,
  };
  TestDetailOverlay({ state, rows: 30 });
  return capturedLines;
}

function textOf(lines) {
  return lines.map(l => l.text || '').join('\n');
}

describe('TestDetailOverlay', () => {
  it('includes suite name and test title', () => {
    const lines = render(makeFailure({ suiteName: 'MyGroup', title: 'my test' }), makeStats());
    const content = textOf(lines);
    expect(content).toContain('MyGroup');
    expect(content).toContain('my test');
  });

  it('includes duration', () => {
    const lines = render(makeFailure({ duration: 123 }), makeStats());
    expect(textOf(lines)).toContain('123ms');
  });

  it('shows N/A when duration is null', () => {
    const lines = render(makeFailure({ duration: null }), makeStats());
    expect(textOf(lines)).toContain('N/A');
  });

  it('extracts Expected/Received from message', () => {
    const messages = ['Expected: 2\nReceived: 3'];
    const lines = render(makeFailure({ messages }), makeStats());
    const content = textOf(lines);
    expect(content).toContain('Expected:');
    expect(content).toContain('Received:');
  });

  it('highlights the first non-node_modules stack frame', () => {
    const messages = [
      'Error: boom\n' +
      '    at Object.<anonymous> (node_modules/jest/build/run.js:1:1)\n' +
      '    at Object.<anonymous> (/project/src/math.test.js:10:5)\n' +
      '    at Object.<anonymous> (node_modules/jest-runner/build/index.js:2:1)'
    ];
    const lines = render(makeFailure({ messages }), makeStats());
    // The highlighted user frame is in the Stack Trace section, has '> at' prefix, and is yellow
    const userFrame = lines.find(l => /^\s+> at/.test(l.text || ''));
    expect(userFrame).toBeDefined();
    expect(userFrame.text).toContain('/project/src/math.test.js');
    expect(userFrame.color).toBe('yellow');
  });

  it('shows (no stack trace) when message has no stack frames', () => {
    const lines = render(makeFailure({ messages: ['simple error, no stack'] }), makeStats());
    expect(textOf(lines)).toContain('(no stack trace)');
  });

  it('includes run metrics from stats', () => {
    const lines = render(makeFailure(), makeStats({ passed: 7, failed: 2, skipped: 1 }));
    const content = textOf(lines);
    expect(content).toContain('Passed');
    expect(content).toContain('Failed');
    expect(content).toContain('Skipped');
  });

  it('escapes curly braces in the raw message', () => {
    const lines = render(makeFailure({ messages: ['got {red-fg}value{/red-fg}'] }), makeStats());
    const content = textOf(lines);
    expect(content).toContain('(red-fg)value(/red-fg)');
  });

  it('returns null when testDetailFailure is not set', () => {
    capturedLines = [];
    const result = TestDetailOverlay({ state: { testDetailFailure: null, testDetailScrollOffset: 0, stats: makeStats() }, rows: 30 });
    expect(result).toBeNull();
  });

  it('first line contains suiteName and title as a header', () => {
    const lines = render(makeFailure({ suiteName: 'Calc', title: 'adds numbers' }), makeStats());
    expect(lines[0].text).toContain('Calc');
    expect(lines[0].text).toContain('adds numbers');
  });

  it('first line is colored red (failure header)', () => {
    const lines = render(makeFailure(), makeStats());
    expect(lines[0].color).toBe('red');
  });

  it('renders elapsed time using endTime when run is complete', () => {
    const stats = makeStats({ startTime: 1000, endTime: 3500 });
    const lines = render(makeFailure(), stats);
    const elapsedLine = lines.find(l => (l.text || '').includes('Elapsed'));
    expect(elapsedLine).toBeDefined();
    expect(elapsedLine.text).toContain('2.5s');
  });

  it('scroll offset starts at 0 (top of detail)', () => {
    // TestDetailOverlay passes testDetailScrollOffset as scrollOffset prop.
    // The state with offset=0 should be passed through; no auto-scroll on open.
    capturedLines = [];
    const state = {
      testDetailFailure: makeFailure(),
      testDetailScrollOffset: 0,
      stats: makeStats(),
    };
    TestDetailOverlay({ state, rows: 30 });
    // If lines were captured, the overlay rendered — confirming it renders at offset 0 without crash
    expect(capturedLines.length).toBeGreaterThan(0);
  });
});
