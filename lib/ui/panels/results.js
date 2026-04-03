'use strict';

const blessed = require('blessed');

function createResults(screen) {
  const widget = blessed.list({
    top: 7, left: 0, width: '65%', bottom: 3,
    label: ' Test Results ',
    border: { type: 'line' },
    tags: true, scrollable: true, alwaysScroll: true,
    keys: false, mouse: false,
    scrollbar: { ch: '|', style: { fg: 'cyan' } },
    style: {
      border: { fg: 'cyan' }, label: { fg: 'cyan', bold: true },
      bg: '#0a0a1a', item: { fg: 'white' },
    },
    padding: { left: 1, right: 1 },
  });
  screen.append(widget);
  return widget;
}

function refreshResults(widget, state) {
  const items = state.resultLines.map((line, i) => {
    if (state.focus === 'results' && i === state.resultCursor) {
      return `{#1a1a4a-bg}${line}{/#1a1a4a-bg}`;
    }
    return line;
  });
  widget.setItems(items);
  if (state.focus === 'results' && state.resultCursor >= 0) {
    widget.scrollTo(state.resultCursor);
  }
}

function updateBorder(widget, focused) {
  widget.style.border.fg = focused ? 'white' : 'cyan';
  widget.setLabel(focused ? ' Test Results [FOCUSED] ' : ' Test Results ');
}

module.exports = { createResults, refreshResults, updateBorder };
