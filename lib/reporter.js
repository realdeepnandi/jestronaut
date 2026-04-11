import { createApp } from './ui/app.js';
import { buildSuiteDetailItems } from './ui/components/SuiteDetailOverlay.js';

export default class DashboardReporter {
  constructor(globalConfig) {
    this._globalConfig = globalConfig;
    const watchMode = globalConfig.watch || globalConfig.watchAll || false;
    const ui = createApp();
    this._store = ui.store;
    this._state = ui.store.state;
    this._state.watchMode = watchMode;
    this._state.watchWaiting = watchMode;
  }

  onRunStart(results) {
    this._store.reset();
    const s = this._state;
    s.watchWaiting = false;
    s.stats.suites = results.numTotalTestSuites;
    s.stats.startTime = Date.now();
    this._store.notify();
  }

  onTestFileStart(test) {
    this._state.suites[test.path] = {
      passed: 0, failed: 0, done: false,
      startTime: Date.now(), endTime: null,
      running: new Set(), tests: [],
    };
    this._state.suiteOrder.push(test.path);
    // Keep suite count in sync in case onRunStart received 0 (Jest discovers tests lazily)
    if (this._state.suiteOrder.length > this._state.stats.suites) {
      this._state.stats.suites = this._state.suiteOrder.length;
    }
    this._store.notify();
  }

  onTestCaseStart(test, info) {
    const suite = this._state.suites[test.path];
    if (suite && info) suite.running.add(info.fullName || info.title);
    this._store.notify();
  }

  onTestCaseResult(test, r) {
    const s = this._state;
    const suite = s.suites[test.path] || {
      passed: 0, failed: 0, done: false,
      startTime: Date.now(), running: new Set(), tests: [],
    };

    s.stats.total++;
    if (suite.running) suite.running.delete(r.fullName || r.title);
    suite.tests.push({ title: r.title, status: r.status, duration: r.duration, messages: r.failureMessages || [] });

    if (r.status === 'passed') {
      s.stats.passed++;
      suite.passed++;
      s.resultMeta.push({ status: 'passed', failureIndex: -1 });
      s.resultItems.push({ icon: 'PASS', iconColor: 'green', ancestor: r.ancestorTitles.join(' > '), title: r.title, titleColor: 'white', duration: r.duration ?? null, isFailed: false });
    } else if (r.status === 'failed') {
      s.stats.failed++;
      suite.failed++;
      const failureIndex = s.failures.length;
      s.failures.push({ title: r.title, suiteName: r.ancestorTitles.join(' > '), messages: r.failureMessages || [], duration: r.duration });
      s.resultMeta.push({ status: 'failed', failureIndex });
      s.resultItems.push({ icon: 'FAIL', iconColor: 'red', ancestor: r.ancestorTitles.join(' > '), title: r.title, titleColor: 'red', duration: r.duration ?? null, isFailed: true });
    } else {
      s.stats.skipped++;
      s.resultMeta.push({ status: r.status, failureIndex: -1 });
      s.resultItems.push({ icon: 'SKIP', iconColor: 'yellow', ancestor: r.ancestorTitles.join(' > '), title: r.title, titleColor: 'yellow', duration: r.duration ?? null, isFailed: false });
    }

    s.suites[test.path] = suite;
    this._refreshOpenSuiteDetail();
    this._store.notify();
  }

  onTestFileResult(test) {
    const suite = this._state.suites[test.path];
    if (suite) {
      suite.done = true;
      suite.endTime = Date.now();
      suite.running = new Set();
      this._state.stats.suitesCompleted++;
    }
    this._refreshOpenSuiteDetail();
    this._store.notify();
  }

  onRunComplete(_, results) {
    // Bootstrap: send null byte to activate our watch plugin and capture updateConfigAndRun
    if (!global.__jestronaut_update_config_and_run__ && global.__jestronaut_emit__) {
      setTimeout(() => {
        global.__jestronaut_block_jest_input__ = false;
        global.__jestronaut_emit__('data', '\x00');
        global.__jestronaut_block_jest_input__ = true;
      }, 500);
    }
    const s = this._state;
    s.runComplete = true;
    s.runOk = results.numFailedTests === 0;
    s.runElapsed = ((Date.now() - s.stats.startTime) / 1000).toFixed(2);
    s.stats.endTime = Date.now();
    if (s.watchMode) s.watchWaiting = true;
    this._store.notify();
  }

  _refreshOpenSuiteDetail() {
    const s = this._state;
    if (!s.suiteDetailOpen || !s.suiteDetailPath) return;
    const result = buildSuiteDetailItems(s.suites[s.suiteDetailPath], s.suiteDetailPath);
    s.suiteDetailItems = result.items;
  }
}
