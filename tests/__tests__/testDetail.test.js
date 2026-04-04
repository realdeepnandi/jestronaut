'use strict';

const { openTestDetail } = require('jestronaut/lib/ui/overlays/testDetail');

function makeWidget() {
  return {
    setLabel: jest.fn(),
    setContent: jest.fn(),
    scrollTo: jest.fn(),
    show: jest.fn(),
    setFront: jest.fn(),
  };
}

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
  return { passed: 3, failed: 1, skipped: 0, startTime: Date.now() - 1000, ...overrides };
}

describe('openTestDetail', () => {
  it('sets the widget label to the failure title', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure({ title: 'blows up' }), makeStats());
    expect(widget.setLabel).toHaveBeenCalledWith(' Test Failure: blows up ');
  });

  it('calls show and setFront', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure(), makeStats());
    expect(widget.show).toHaveBeenCalled();
    expect(widget.setFront).toHaveBeenCalled();
  });

  it('scrolls to top', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure(), makeStats());
    expect(widget.scrollTo).toHaveBeenCalledWith(0);
  });

  it('includes suite name and test title in content', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure({ suiteName: 'MyGroup', title: 'my test' }), makeStats());
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('MyGroup');
    expect(content).toContain('my test');
  });

  it('includes duration in content', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure({ duration: 123 }), makeStats());
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('123ms');
  });

  it('shows N/A when duration is null', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure({ duration: null }), makeStats());
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('N/A');
  });

  it('extracts and highlights Expected/Received from message', () => {
    const widget = makeWidget();
    const messages = ['Expected: 2\nReceived: 3'];
    openTestDetail(widget, makeFailure({ messages }), makeStats());
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('Expected:');
    expect(content).toContain('Received:');
  });

  it('highlights the first non-node_modules stack frame', () => {
    const widget = makeWidget();
    const messages = [
      'Error: boom\n' +
      '    at Object.<anonymous> (node_modules/jest/build/run.js:1:1)\n' +
      '    at Object.<anonymous> (/project/src/math.test.js:10:5)\n' +
      '    at Object.<anonymous> (node_modules/jest-runner/build/index.js:2:1)'
    ];
    openTestDetail(widget, makeFailure({ messages }), makeStats());
    const content = widget.setContent.mock.calls[0][0];
    // The first user frame should be highlighted with yellow-fg and a '>'
    expect(content).toContain('{yellow-fg}> at Object.<anonymous> (/project/src/math.test.js:10:5){/yellow-fg}');
  });

  it('shows (no stack trace) when message has no stack frames', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure({ messages: ['simple error, no stack'] }), makeStats());
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('(no stack trace)');
  });

  it('includes run metrics from stats', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure(), makeStats({ passed: 7, failed: 2, skipped: 1 }));
    const content = widget.setContent.mock.calls[0][0];
    expect(content).toContain('7');
    expect(content).toContain('2');
    expect(content).toContain('1');
  });

  it('escapes blessed tags in the raw message', () => {
    const widget = makeWidget();
    openTestDetail(widget, makeFailure({ messages: ['got {red-fg}value{/red-fg}'] }), makeStats());
    const content = widget.setContent.mock.calls[0][0];
    // Curly braces should be replaced with parens so blessed doesn't parse them
    expect(content).toContain('(red-fg)value(/red-fg)');
  });
});
