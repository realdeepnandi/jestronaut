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
  // Reuse screen and widgets across watch re-runs — Jest re-instantiates the
  // reporter on every run, but we must not create a second blessed screen.
  if (global.__jestronaut_ui__) {
    const { screen, widgets, startTicker, state: sharedState } = global.__jestronaut_ui__;
    screen.realloc();
    return {
      screen, widgets,
      renderAll: () => renderAll(screen, widgets, sharedState),
      refreshOpenSuiteDetail: () => refreshOpenSuiteDetail(widgets, sharedState),
      startTicker,
    };
  }

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

  function startTicker() {
    if (state._ticker) clearInterval(state._ticker);
    state._ticker = setInterval(() => {
      state.spinFrame = (state.spinFrame + 1) % SPINNER.length;
      updateSuites(widgets.suites, state);
      updateFooter(widgets.footer, state);
      screen.render();
    }, 120);
  }

  global.__jestronaut_ui__ = { screen, widgets, startTicker, state };

  startTicker();
  renderAll(screen, widgets, state);

  return { screen, widgets, renderAll: () => renderAll(screen, widgets, state), refreshOpenSuiteDetail: () => refreshOpenSuiteDetail(widgets, state), startTicker };
}

function renderAll(screen, widgets, state) {
  // Only pass keypresses to Jest's watch mode when truly idle:
  // watch waiting, no overlays, and no results to navigate
  global.__jestronaut_block_jest_input__ = !(
    state.watchWaiting &&
    !state.suiteDetailOpen &&
    !state.testDetailOpen &&
    state.resultLines.length === 0
  );
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
