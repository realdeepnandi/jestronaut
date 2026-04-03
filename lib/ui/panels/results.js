'use strict';

const blessed = require('blessed');

function createResults(screen) {
  const widget = blessed.list({
    top: 6, left: 0, width: '65%', bottom: 3,
    label: ' Test Results ',
    border: { type: 'line' },
    tags: true, scrollable: true, alwaysScroll: true,
    keys: false, mouse: false,
    scrollbar: { ch: '|', style: { fg: 'cyan' } },
    style: {
      border: { fg: 'cyan' }, label: { fg: 'cyan', bold: true },
      bg: '#0a0a1a', item: { fg: 'white', bg: '#0a0a1a' },
      selected: { bg: '#1a1a4a', bold: true },
    },
    padding: { left: 1, right: 1 },
  });
  screen.append(widget);
  return widget;
}

function refreshResults(widget, state) {
  const overlayOpen = state.suiteDetailOpen || state.testDetailOpen;
  const active = !overlayOpen && state.focus === 'results' && state.resultCursor >= 0;
  widget.setItems(state.resultLines);
  if (active) {
    widget.select(state.resultCursor);
    widget.scrollTo(state.resultCursor);
  } else {
    widget.select(-1);
  }
}

function updateBorder(widget, focused) {
  widget.style.border.fg = focused ? 'white' : 'cyan';
  widget.setLabel(focused ? ' Test Results [FOCUSED] ' : ' Test Results ');
}

module.exports = { createResults, refreshResults, updateBorder };
