'use strict';

const blessed = require('blessed');
const { SPINNER } = require('../../constants');

function createFooter(screen) {
  const widget = blessed.box({
    bottom: 0, left: 0, width: '100%', height: 3,
    tags: true,
    style: { fg: 'white', bg: '#111133' },
  });
  screen.append(widget);
  return widget;
}

function updateFooter(widget, state) {
  const endTime = state.stats.endTime || Date.now();
  const elapsed = ((endTime - state.stats.startTime) / 1000).toFixed(1);
  const suiteStr = `${state.stats.suitesCompleted}/${state.stats.suites} suites`;
  const spin = SPINNER[state.spinFrame];
  const running = Object.values(state.suites).filter(s => !s.done).length;
  const runningStr = running > 0 ? ` {yellow-fg}${spin} ${running} running{/yellow-fg}  |` : '';
  const hint = _getHint(state);

  widget.setContent(
    `{center}{grey-fg} Time: ${elapsed}s  |${runningStr}  ${suiteStr}  |  ${hint}  |  [q] quit {/grey-fg}{/center}`
  );
}

function _getHint(state) {
  if (state.testDetailOpen) {
    return '{cyan-fg}[Esc]{/cyan-fg} close  |  {cyan-fg}[j/k]{/cyan-fg} scroll';
  }
  if (state.suiteDetailOpen) {
    return '{cyan-fg}[j/k]{/cyan-fg} navigate failed tests  |  {cyan-fg}[Enter]{/cyan-fg} open failure  |  {cyan-fg}[Esc]{/cyan-fg} back';
  }
  if (state.watchWaiting) {
    return '{yellow-fg}[a]{/yellow-fg} run all tests';
  }
  if (state.focus === 'results') {
    return '{cyan-fg}[Tab]{/cyan-fg} switch panel  |  {cyan-fg}[Enter]{/cyan-fg} open failure';
  }
  return '{cyan-fg}[Tab]{/cyan-fg} switch panel  |  {cyan-fg}[Enter]{/cyan-fg} open suite';
}

module.exports = { createFooter, updateFooter };
