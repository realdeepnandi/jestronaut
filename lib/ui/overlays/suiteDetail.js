'use strict';

const blessed = require('blessed');

function createSuiteDetail(screen) {
  const widget = blessed.list({
    top: '3%', left: '3%', width: '94%', height: '94%',
    label: ' Suite Detail ',
    border: { type: 'line' },
    tags: true, scrollable: true, alwaysScroll: true,
    keys: false, mouse: false,
    scrollbar: { ch: '|', style: { fg: 'magenta' } },
    style: {
      border: { fg: 'magenta' }, label: { fg: 'magenta', bold: true },
      bg: '#08080a', item: { fg: 'white' },
    },
    padding: { left: 2, right: 2, top: 1, bottom: 1 },
    hidden: true,
  });
  screen.append(widget);
  return widget;
}

function buildSuiteDetailLines(suiteData, path) {
  const s = suiteData;
  const name = path.split('/').pop().replace(/\.test\.[jt]sx?$/, '');
  const totalTests = (s.tests || []).length;
  const duration = s.endTime && s.startTime
    ? ((s.endTime - s.startTime) / 1000).toFixed(2) + 's'
    : 'running...';
  const status = !s.done ? 'RUNNING' : s.failed > 0 ? 'FAILED' : 'PASSED';
  const statusColor = !s.done ? 'yellow' : s.failed > 0 ? 'red' : 'green';
  const passRate = totalTests > 0 ? Math.round((s.passed / totalTests) * 100) : 0;

  const lines = [];
  const meta = [];

  const add = (text, m = { type: 'other' }) => { lines.push(text); meta.push(m); };

  add(`{${statusColor}-fg}{bold}Suite: ${name}  [${status}]{/bold}{/${statusColor}-fg}`);
  add('');
  add(`{yellow-fg}File     :{/yellow-fg}  {grey-fg}${path}{/grey-fg}`);
  add(`{yellow-fg}Duration :{/yellow-fg}  ${duration}`);
  add(`{yellow-fg}Pass rate:{/yellow-fg}  {${statusColor}-fg}${passRate}%{/${statusColor}-fg}`);
  add(`{yellow-fg}Tests    :{/yellow-fg}  ${totalTests} total  {green-fg}${s.passed} passed{/green-fg}  {red-fg}${s.failed} failed{/red-fg}`);
  add(`{yellow-fg}Slowest  :{/yellow-fg}  ${_slowest(s.tests || [])}`);
  add(`{yellow-fg}Fastest  :{/yellow-fg}  ${_fastest(s.tests || [])}`);
  add('');
  add(`{cyan-fg}── Test Results (${totalTests}) ─────────────────────────────────────────────{/cyan-fg}`);
  add('');

  const tests = s.tests || [];
  if (tests.length === 0) {
    add('  {grey-fg}(no results yet){/grey-fg}');
  } else {
    tests.forEach(t => {
      if (t.status === 'passed') {
        add(
          `  {green-fg}PASS{/green-fg}  {white-fg}${t.title}{/white-fg}  {grey-fg}(${t.duration != null ? t.duration + 'ms' : '?'}){/grey-fg}`,
          { type: 'test', failureObj: null }
        );
      } else if (t.status === 'failed') {
        add(
          `  {red-fg}FAIL{/red-fg}  {red-fg}${t.title}{/red-fg}  {grey-fg}(${t.duration != null ? t.duration + 'ms' : '?'}){/grey-fg}  {cyan-fg}[Enter]{/cyan-fg}`,
          {
            type: 'test',
            failureObj: { title: t.title, suiteName: name, messages: t.messages || [], duration: t.duration },
          }
        );
      } else {
        add(
          `  {yellow-fg}SKIP{/yellow-fg}  {grey-fg}${t.title}{/grey-fg}`,
          { type: 'test', failureObj: null }
        );
      }
    });
  }

  add('');
  add('{grey-fg}  [j/k] navigate failed tests   [Enter] open failure   [Esc] back{/grey-fg}');

  return { lines, meta, name, hasFailed: s.failed > 0, label: ` Suite: ${name}  [${s.passed}p ${s.failed}f] ` };
}

function refreshSuiteDetail(widget, state) {
  const items = state.suiteDetailLines.map((line, i) => {
    const m = state.suiteDetailMeta[i];
    const isFailed = m && m.type === 'test' && m.failureObj;
    if (i === state.suiteDetailCursor && isFailed) {
      return `{#3a0a0a-bg}> ${line.trimStart()}{/#3a0a0a-bg}`;
    }
    return line;
  });
  widget.setItems(items);
  widget.scrollTo(state.suiteDetailCursor);
}

function moveCursor(state, dir) {
  const meta = state.suiteDetailMeta;
  if (meta.length === 0) return;
  const failIndices = meta
    .map((m, i) => (m.type === 'test' && m.failureObj) ? i : -1)
    .filter(i => i >= 0);
  if (failIndices.length === 0) return;
  const pos = failIndices.indexOf(state.suiteDetailCursor);
  if (dir > 0) {
    state.suiteDetailCursor = pos < failIndices.length - 1 ? failIndices[pos + 1] : failIndices[0];
  } else {
    state.suiteDetailCursor = pos > 0 ? failIndices[pos - 1] : failIndices[failIndices.length - 1];
  }
}

function _slowest(tests) {
  const t = tests.filter(t => t.duration != null).sort((a, b) => b.duration - a.duration)[0];
  return t ? `{white-fg}${t.title}{/white-fg} {grey-fg}(${t.duration}ms){/grey-fg}` : 'N/A';
}

function _fastest(tests) {
  const t = tests.filter(t => t.duration != null).sort((a, b) => a.duration - b.duration)[0];
  return t ? `{white-fg}${t.title}{/white-fg} {grey-fg}(${t.duration}ms){/grey-fg}` : 'N/A';
}

module.exports = { createSuiteDetail, buildSuiteDetailLines, refreshSuiteDetail, moveCursor };
