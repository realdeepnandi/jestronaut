'use strict';

const blessed = require('blessed');

function createStats(screen) {
  const widget = blessed.box({
    top: 2, left: 0, width: '100%', height: 2,
    tags: true,
    style: { fg: 'white', bg: '#111133' },
  });
  screen.append(widget);
  return widget;
}

function updateStats(widget, stats) {
  const { passed, failed, skipped, total } = stats;
  widget.setContent(
    '{center}' +
    `{green-fg}{bold}  PASSED: ${passed}  {/bold}{/green-fg}` +
    `{red-fg}{bold}  FAILED: ${failed}  {/bold}{/red-fg}` +
    `{yellow-fg}{bold}  SKIPPED: ${skipped}  {/bold}{/yellow-fg}` +
    `{white-fg}  TOTAL: ${total}  {/white-fg}` +
    '{/center}'
  );
}

module.exports = { createStats, updateStats };
