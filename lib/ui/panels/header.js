'use strict';

const blessed = require('blessed');

function createHeader(screen) {
  const widget = blessed.box({
    top: 0, left: 0, width: '100%', height: 2,
    content: '{center}{bold} JEST TEST DASHBOARD {/bold}{/center}',
    tags: true,
    style: { fg: 'white', bg: 'blue', bold: true },
  });
  screen.append(widget);
  return widget;
}

function updateHeader(widget, ok) {
  widget.style.bg = ok ? 'green' : 'red';
  widget.setContent(
    `{center}{bold} ${ok ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} {/bold}{/center}`
  );
}

module.exports = { createHeader, updateHeader };
