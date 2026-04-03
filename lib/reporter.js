'use strict';

const { createState } = require('./state');
const { createScreen } = require('./ui/screen');
const { updateHeader } = require('./ui/panels/header');
const { updateStats } = require('./ui/panels/stats');
const { updateProgress } = require('./ui/panels/progress');
const { updateFooter } = require('./ui/panels/footer');

class DashboardReporter {
  constructor(globalConfig) {
    this._globalConfig = globalConfig;
    this._state = createState();
    const { screen, widgets, renderAll, refreshOpenSuiteDetail } = createScreen(this._state);
    this._screen = screen;
    this._widgets = widgets;
    this._renderAll = renderAll;
    this._refreshOpenSuiteDetail = refreshOpenSuiteDetail;
  }

  onRunStart(results) {
    const s = this._state;
    s.stats.suites = results.numTotalTestSuites;
    s.stats.expectedTotal = results.numTotalTests || 0;
    s.stats.startTime = Date.now();
    this._renderAll();
  }

  onTestFileStart(test) {
    this._state.suites[test.path] = {
      passed: 0, failed: 0, done: false,
      startTime: Date.now(), endTime: null,
      running: new Set(), tests: [],
    };
    this._state.suiteOrder.push(test.path);
    this._renderAll();
  }

  onTestCaseStart(test, info) {
    const suite = this._state.suites[test.path];
    if (suite && info) suite.running.add(info.fullName || info.title);
  }

  onTestCaseResult(test, r) {
    const s = this._state;
    const suite = s.suites[test.path] || {
      passed: 0, failed: 0, done: false,
      startTime: Date.now(), running: new Set(), tests: [],
    };

    s.stats.total++;
    if (suite.running) suite.running.delete(r.fullName || r.title);

    suite.tests.push({
      title: r.title,
      status: r.status,
      duration: r.duration,
      messages: r.failureMessages || [],
    });

    let icon, textColor;

    if (r.status === 'passed') {
      s.stats.passed++;
      suite.passed++;
      icon = '{green-fg}PASS{/green-fg}';
      textColor = 'white-fg';
      s.resultMeta.push({ status: 'passed', failureIndex: -1 });
    } else if (r.status === 'failed') {
      s.stats.failed++;
      suite.failed++;
      icon = '{red-fg}FAIL{/red-fg}';
      textColor = 'red-fg';
      const failureIndex = s.failures.length;
      s.failures.push({
        title: r.title,
        suiteName: r.ancestorTitles.join(' > '),
        messages: r.failureMessages || [],
        duration: r.duration,
      });
      s.resultMeta.push({ status: 'failed', failureIndex });
    } else {
      s.stats.skipped++;
      icon = '{yellow-fg}SKIP{/yellow-fg}';
      textColor = 'yellow-fg';
      s.resultMeta.push({ status: r.status, failureIndex: -1 });
    }

    s.suites[test.path] = suite;

    const ms = r.duration != null ? ` {grey-fg}(${r.duration}ms){/grey-fg}` : '';
    const ancestor = r.ancestorTitles.join(' > ');
    const prefix = ancestor ? `{grey-fg}${ancestor} >{/grey-fg} ` : '';
    const hint = r.status === 'failed' ? ' {cyan-fg}[Enter]{/cyan-fg}' : '';
    s.resultLines.push(`[${icon}] ${prefix}{${textColor}}${r.title}{/${textColor}}${ms}${hint}`);

    this._refreshOpenSuiteDetail();
    this._renderAll();
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
    this._renderAll();
  }

  onRunComplete(_, results) {
    const s = this._state;
    if (s._ticker) { clearInterval(s._ticker); s._ticker = null; }

    const elapsed = ((Date.now() - s.stats.startTime) / 1000).toFixed(2);
    const ok = results.numFailedTests === 0;

    updateHeader(this._widgets.header, ok);
    this._widgets.header.setContent(
      `{center}{bold} ${ok ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} — ${elapsed}s {/bold}{/center}`
    );

    s.stats.expectedTotal = s.stats.total;
    updateStats(this._widgets.stats, s.stats);
    updateProgress(this._widgets.progress, s.stats, this._screen.width);
    updateFooter(this._widgets.footer, s);
    this._renderAll();
  }
}

module.exports = DashboardReporter;
