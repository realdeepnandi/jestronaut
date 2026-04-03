'use strict';

const blessed = require('blessed');
const { SPINNER } = require('../../constants');

function createSuites(screen) {
  const widget = blessed.list({
    top: 6, right: 0, width: '35%', bottom: 3,
    label: ' Suites ',
    border: { type: 'line' },
    tags: true, scrollable: true, alwaysScroll: true,
    keys: false, mouse: false,
    scrollbar: { ch: '|', style: { fg: 'magenta' } },
    style: {
      border: { fg: 'magenta' }, label: { fg: 'magenta', bold: true },
      bg: '#0a0a1a', item: { fg: 'white', bg: '#0a0a1a' },
      selected: { bg: '#1a0a3a', bold: true },
    },
    padding: { left: 1, right: 1 },
  });
  screen.append(widget);
  return widget;
}

function updateSuites(widget, state) {
  const spin = SPINNER[state.spinFrame];
  const items = state.suiteOrder.map((path, i) => {
    const s = state.suites[path];
    const name = path.split('/').pop().replace(/\.test\.[jt]sx?$/, '');
    const elapsed = s.startTime ? ` ${((Date.now() - s.startTime) / 1000).toFixed(1)}s` : '';

    let icon, detail;
    if (s.done) {
      icon = s.failed > 0 ? '{red-fg}FAIL{/red-fg}' : '{green-fg}PASS{/green-fg}';
      detail = ` {grey-fg}[${s.passed}p ${s.failed}f]{/grey-fg}`;
    } else {
      icon = `{yellow-fg}${spin}{/yellow-fg}`;
      detail = `{grey-fg}${elapsed} [${s.passed}p ${s.failed}f]{/grey-fg}`;
    }

    const runningLines = s.running && s.running.size > 0
      ? '\n' + [...s.running].map(t => `  {cyan-fg}> ${t}{/cyan-fg}`).join('\n')
      : '';

    const isCursor = state.focus === 'suites' && !state.suiteDetailOpen && !state.testDetailOpen && i === state.suiteCursor;
    const hint = isCursor ? ' {cyan-fg}[Enter]{/cyan-fg}' : '';

    return `${icon} {white-fg}${name}{/white-fg}${detail}${hint}${runningLines}`;
  });

  widget.setItems(items.length ? items : ['{grey-fg}waiting...{/grey-fg}']);
  const active = state.focus === 'suites' && !state.suiteDetailOpen && !state.testDetailOpen;
  if (active && state.suiteCursor >= 0) {
    widget.select(state.suiteCursor);
    widget.scrollTo(state.suiteCursor);
  } else {
    widget.select(-1);
  }
}

function updateBorder(widget, focused) {
  widget.style.border.fg = focused ? 'white' : 'magenta';
  widget.setLabel(focused ? ' Suites [FOCUSED] ' : ' Suites ');
}

module.exports = { createSuites, updateSuites, updateBorder };
