export function createState() {
  return {
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
    suites: {},
    suiteOrder: [],
    resultItems: [],  // [{ icon, iconColor, ancestor, title, titleColor, duration, isFailed }]
    resultMeta: [],   // [{ status, failureIndex }]
    failures: [],     // [{ title, suiteName, messages, duration }]
    focus: 'results',
    resultCursor: -1,
    suiteCursor: 0,
    suiteDetailOpen: false,
    suiteDetailPath: null,
    suiteDetailItems: [],  // [{ type, text, color, failureObj }]
    suiteDetailCursor: 0,
    testDetailOpen: false,
    testDetailFailure: null,
    testDetailScrollOffset: 0,
    runComplete: false,
    runOk: false,
    runElapsed: null,
    spinFrame: 0,
    watchMode: false,
    watchWaiting: false,
  };
}

export function resetState(state) {
  state.stats = {
    passed: 0, failed: 0, skipped: 0,
    total: 0, expectedTotal: 0,
    suites: 0, suitesCompleted: 0,
    startTime: Date.now(),
    endTime: null,
  };
  state.suites = {};
  state.suiteOrder = [];
  state.resultItems = [];
  state.resultMeta = [];
  state.failures = [];
  state.resultCursor = -1;
  state.suiteCursor = 0;
  state.suiteDetailOpen = false;
  state.suiteDetailPath = null;
  state.suiteDetailItems = [];
  state.suiteDetailCursor = 0;
  state.testDetailOpen = false;
  state.testDetailFailure = null;
  state.testDetailScrollOffset = 0;
  state.runComplete = false;
  state.runOk = false;
  state.runElapsed = null;
  state.spinFrame = 0;
  // watchMode and watchWaiting preserved across resets
}
