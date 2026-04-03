'use strict';

const blessed = require('blessed');
const { SPINNER } = require('../constants');
const { createHeader, updateHeader } = require('./panels/header');
const { createStats, updateStats } = require('./panels/stats');
const { createProgress, updateProgress } = require('./panels/progress');
const { createResults, refreshResults, updateBorder: updateResultsBorder } = require('./panels/results');
const { createSuites, updateSuites, updateBorder: updateSuitesBorder } = require('./panels/suites');
const { createFooter, updateFooter } = require('./panels/footer');
const { createSuiteDetail } = require('./overlays/suiteDetail');
const { createTestDetail } = require('./overlays/testDetail');
const { bindKeys, refreshOpenSuiteDetail } = require('./keys');

function createScreen(state) {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Jest Dashboard',
    fullUnicode: false,
    warnings: false,
    terminal: 'xterm-256color',
  });

  const widgets = {
    header:      createHeader(screen),
    stats:       createStats(screen),
    progress:    createProgress(screen),
    results:     createResults(screen),
    suites:      createSuites(screen),
    footer:      createFooter(screen),
    suiteDetail: createSuiteDetail(screen),
    testDetail:  createTestDetail(screen),
  };

  // render helpers passed to key bindings
  const render = {
    all: () => renderAll(screen, widgets, state),
    destroy: () => {
      if (state._ticker) clearInterval(state._ticker);
      screen.destroy();
    },
  };

  bindKeys(screen, widgets, state, render);

  // animation ticker
  state._ticker = setInterval(() => {
    state.spinFrame = (state.spinFrame + 1) % SPINNER.length;
    updateSuites(widgets.suites, state);
    updateFooter(widgets.footer, state);
    screen.render();
  }, 120);

  renderAll(screen, widgets, state);

  return { screen, widgets, renderAll: () => renderAll(screen, widgets, state), refreshOpenSuiteDetail: () => refreshOpenSuiteDetail(widgets, state) };
}

function renderAll(screen, widgets, state) {
  updateStats(widgets.stats, state.stats);
  updateProgress(widgets.progress, state.stats, screen.width);
  updateSuites(widgets.suites, state);
  updateFooter(widgets.footer, state);
  _updateBorders(widgets, state);
  refreshResults(widgets.results, state);
  screen.render();
}

function _updateBorders(widgets, state) {
  updateResultsBorder(widgets.results, state.focus === 'results');
  updateSuitesBorder(widgets.suites, state.focus === 'suites');
}

module.exports = { createScreen };
