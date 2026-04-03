'use strict';

const blessed = require('blessed');

function createProgress(screen) {
  const widget = blessed.box({
    top: 5, left: 0, width: '100%', height: 2,
    tags: true,
    style: { fg: 'white', bg: '#111133' },
  });
  screen.append(widget);
  return widget;
}

function updateProgress(widget, stats, screenWidth) {
  const done = stats.passed + stats.failed + stats.skipped;
  const total = stats.expectedTotal || done || 1;
  const pct = Math.min(100, Math.round((done / total) * 100));
  const bar = _buildBar(pct, screenWidth, stats.failed > 0);
  widget.setContent(` Progress: ${bar} ${pct}%`);
}

function _buildBar(pct, screenWidth, hasFailed) {
  const w = Math.max(20, (screenWidth || 80) - 20);
  const filled = Math.round((pct / 100) * w);
  const bar = '#'.repeat(filled) + '-'.repeat(w - filled);
  const color = hasFailed ? 'red' : 'green';
  return `{${color}-fg}${bar}{/${color}-fg}`;
}

module.exports = { createProgress, updateProgress };
