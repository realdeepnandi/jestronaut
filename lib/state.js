'use strict';

// Central mutable state shared across all UI modules.
// All modules receive a reference to this object and read/write it directly.

function createState() {
  return {
    // run-level stats
    stats: {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      expectedTotal: 0,
      suites: 0,
      suitesCompleted: 0,
      startTime: Date.now(),
      endTime: null,
    },

    // suite data keyed by file path
    suites: {},
    suiteOrder: [],

    // flat list of all test results for the results panel
    resultLines: [],  // display strings
    resultMeta: [],   // { status, failureIndex }

    // all failure objects for detail view
    failures: [],     // { title, suiteName, messages, duration }

    // panel focus
    focus: 'results', // 'results' | 'suites'
    resultCursor: -1,
    suiteCursor: 0,

    // suite detail overlay
    suiteDetailOpen: false,
    suiteDetailPath: null,
    suiteDetailLines: [],
    suiteDetailMeta: [],
    suiteDetailCursor: 0,

    // test detail overlay
    testDetailOpen: false,

    // animation
    spinFrame: 0,

    // watch mode
    watchMode: false,
    watchWaiting: false,
  };
}

function resetState(state) {
  state.stats = {
    passed: 0, failed: 0, skipped: 0,
    total: 0, expectedTotal: 0,
    suites: 0, suitesCompleted: 0,
    startTime: Date.now(),
    endTime: null,
  };
  state.suites = {};
  state.suiteOrder = [];
  state.resultLines = [];
  state.resultMeta = [];
  state.failures = [];
  state.resultCursor = -1;
  state.suiteCursor = 0;
  state.suiteDetailOpen = false;
  state.suiteDetailPath = null;
  state.suiteDetailLines = [];
  state.suiteDetailMeta = [];
  state.suiteDetailCursor = 0;
  state.testDetailOpen = false;
  state.spinFrame = 0;
  // watchMode and watchWaiting are intentionally preserved across resets
}

module.exports = { createState, resetState };
