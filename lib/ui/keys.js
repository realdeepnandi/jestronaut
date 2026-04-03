'use strict';

const suiteDetailOverlay = require('./overlays/suiteDetail');
const { openTestDetail } = require('./overlays/testDetail');

function bindKeys(screen, widgets, state, render) {
  screen.key(['q', 'C-c'], () => {
    render.destroy();
    process.exit(0);
  });

  screen.key(['tab'], () => {
    if (state.suiteDetailOpen || state.testDetailOpen) return;
    state.focus = state.focus === 'results' ? 'suites' : 'results';
    render.all();
  });

  screen.key(['up', 'k'], () => {
    if (state.testDetailOpen) {
      widgets.testDetail.scroll(-1); screen.render(); return;
    }
    if (state.suiteDetailOpen) {
      suiteDetailOverlay.moveCursor(state, -1);
      suiteDetailOverlay.refreshSuiteDetail(widgets.suiteDetail, state);
      screen.render(); return;
    }
    if (state.focus === 'results') {
      if (state.resultLines.length === 0) return;
      state.resultCursor = state.resultCursor <= 0
        ? state.resultLines.length - 1
        : state.resultCursor - 1;
    } else {
      if (state.suiteOrder.length === 0) return;
      state.suiteCursor = state.suiteCursor <= 0
        ? state.suiteOrder.length - 1
        : state.suiteCursor - 1;
    }
    render.all();
  });

  screen.key(['down', 'j'], () => {
    if (state.testDetailOpen) {
      widgets.testDetail.scroll(1); screen.render(); return;
    }
    if (state.suiteDetailOpen) {
      suiteDetailOverlay.moveCursor(state, 1);
      suiteDetailOverlay.refreshSuiteDetail(widgets.suiteDetail, state);
      screen.render(); return;
    }
    if (state.focus === 'results') {
      if (state.resultLines.length === 0) return;
      state.resultCursor = state.resultCursor >= state.resultLines.length - 1
        ? 0
        : state.resultCursor + 1;
    } else {
      if (state.suiteOrder.length === 0) return;
      state.suiteCursor = state.suiteCursor >= state.suiteOrder.length - 1
        ? 0
        : state.suiteCursor + 1;
    }
    render.all();
  });

  screen.key(['enter'], () => {
    if (state.testDetailOpen) return;

    if (state.suiteDetailOpen) {
      const meta = state.suiteDetailMeta[state.suiteDetailCursor];
      if (meta && meta.type === 'test' && meta.failureObj) {
        state.testDetailOpen = true;
        openTestDetail(widgets.testDetail, meta.failureObj, state.stats);
        screen.render();
      }
      return;
    }

    if (state.focus === 'results') {
      if (state.resultCursor < 0 || state.resultCursor >= state.resultMeta.length) return;
      const meta = state.resultMeta[state.resultCursor];
      if (meta.status !== 'failed') return;
      state.testDetailOpen = true;
      openTestDetail(widgets.testDetail, state.failures[meta.failureIndex], state.stats);
      screen.render();
    } else {
      if (state.suiteOrder.length === 0) return;
      const path = state.suiteOrder[state.suiteCursor];
      if (!path) return;
      _openSuiteDetail(widgets, state, path);
      screen.render();
    }
  });

  screen.key(['escape'], () => {
    if (state.testDetailOpen) {
      state.testDetailOpen = false;
      widgets.testDetail.hide();
      screen.render();
      return;
    }
    if (state.suiteDetailOpen) {
      state.suiteDetailOpen = false;
      state.suiteDetailPath = null;
      state.suiteDetailLines = [];
      state.suiteDetailMeta = [];
      widgets.suiteDetail.hide();
      screen.render();
    }
  });
}

function _openSuiteDetail(widgets, state, path) {
  const result = suiteDetailOverlay.buildSuiteDetailLines(state.suites[path], path);
  state.suiteDetailOpen = true;
  state.suiteDetailPath = path;
  state.suiteDetailLines = result.lines;
  state.suiteDetailMeta = result.meta;
  state.suiteDetailCursor = result.meta.findIndex(m => m.type === 'test' && m.failureObj);
  if (state.suiteDetailCursor < 0) state.suiteDetailCursor = 0;
  widgets.suiteDetail.setLabel(result.label);
  widgets.suiteDetail.style.border.fg = result.hasFailed ? 'red' : 'green';
  widgets.suiteDetail.show();
  suiteDetailOverlay.refreshSuiteDetail(widgets.suiteDetail, state);
}

// Called when a suite receives new results while suite detail is open
function refreshOpenSuiteDetail(widgets, state) {
  if (!state.suiteDetailOpen || !state.suiteDetailPath) return;
  const result = suiteDetailOverlay.buildSuiteDetailLines(
    state.suites[state.suiteDetailPath],
    state.suiteDetailPath
  );
  state.suiteDetailLines = result.lines;
  state.suiteDetailMeta = result.meta;
  widgets.suiteDetail.setLabel(result.label);
  widgets.suiteDetail.style.border.fg = result.hasFailed ? 'red' : 'green';
  suiteDetailOverlay.refreshSuiteDetail(widgets.suiteDetail, state);
}

module.exports = { bindKeys, refreshOpenSuiteDetail };
