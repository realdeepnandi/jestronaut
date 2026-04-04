import React from 'react';
import { Box } from 'ink';
import { ScrollableList } from './ScrollableList.js';

export function buildSuiteDetailItems(suiteData, path) {
  const s = suiteData;
  const name = path.split('/').pop().replace(/\.test\.[jt]sx?$/, '');
  const totalTests = (s.tests || []).length;
  const duration = s.endTime && s.startTime
    ? ((s.endTime - s.startTime) / 1000).toFixed(2) + 's'
    : 'running...';
  const status = !s.done ? 'RUNNING' : s.failed > 0 ? 'FAILED' : 'PASSED';
  const statusColor = !s.done ? 'yellow' : s.failed > 0 ? 'red' : 'green';
  const passRate = totalTests > 0 ? Math.round((s.passed / totalTests) * 100) : 0;

  const items = [];
  const add = (text, color = 'white', type = 'other', failureObj = null) =>
    items.push({ text, color, type, failureObj });

  add(`Suite: ${name}  [${status}]`, statusColor);
  add('');
  add(`File     :  ${path}`, 'yellow');
  add(`Duration :  ${duration}`, 'white');
  add(`Pass rate:  ${passRate}%`, statusColor);
  add(`Tests    :  ${totalTests} total  ${s.passed} passed  ${s.failed} failed`, 'white');
  add(`Slowest  :  ${_slowest(s.tests || [])}`, 'white');
  add(`Fastest  :  ${_fastest(s.tests || [])}`, 'white');
  add('');
  add(`── Test Results (${totalTests}) ──────────────────────────────`, 'cyan');
  add('');

  const tests = s.tests || [];
  if (tests.length === 0) {
    add('  (no results yet)', 'gray');
  } else {
    for (const t of tests) {
      const dur = t.duration != null ? t.duration + 'ms' : '?';
      if (t.status === 'passed') {
        add(`  PASS  ${t.title}  (${dur})`, 'green', 'test', null);
      } else if (t.status === 'failed') {
        add(
          `  FAIL  ${t.title}  (${dur})  [Enter]`,
          'red', 'test',
          { title: t.title, suiteName: name, messages: t.messages || [], duration: t.duration }
        );
      } else {
        add(`  SKIP  ${t.title}`, 'yellow', 'test', null);
      }
    }
  }

  add('');
  add('  [j/k] navigate failed   [Enter] open failure   [Esc] back', 'gray');

  return {
    items,
    name,
    hasFailed: s.failed > 0,
    label: ` Suite: ${name}  [${s.passed}p ${s.failed}f] `,
  };
}

export function moveCursor(state, dir) {
  const items = state.suiteDetailItems;
  if (!items.length) return;
  const failIndices = items.map((m, i) => (m.type === 'test' && m.failureObj) ? i : -1).filter(i => i >= 0);
  if (!failIndices.length) return;
  const pos = failIndices.indexOf(state.suiteDetailCursor);
  if (dir > 0) {
    state.suiteDetailCursor = pos < failIndices.length - 1 ? failIndices[pos + 1] : failIndices[0];
  } else {
    state.suiteDetailCursor = pos > 0 ? failIndices[pos - 1] : failIndices[failIndices.length - 1];
  }
}

function _slowest(tests) {
  const t = tests.filter(t => t.duration != null).sort((a, b) => b.duration - a.duration)[0];
  return t ? `${t.title} (${t.duration}ms)` : 'N/A';
}

function _fastest(tests) {
  const t = tests.filter(t => t.duration != null).sort((a, b) => a.duration - b.duration)[0];
  return t ? `${t.title} (${t.duration}ms)` : 'N/A';
}

export function SuiteDetailOverlay({ state, rows }) {
  const { suiteDetailItems, suiteDetailCursor, suiteDetailPath } = state;
  const hasFailed = suiteDetailItems.some(i => i.type === 'test' && i.failureObj);

  const listItems = suiteDetailItems.map((item, i) => {
    const isSelected = i === suiteDetailCursor && item.type === 'test' && item.failureObj;
    return {
      text: isSelected ? `> ${item.text.trimStart()}` : `  ${item.text}`,
      color: item.color,
      bg: isSelected ? '#5a0a0a' : undefined,
    };
  });

  return React.createElement(
    Box,
    { flexDirection: 'column', height: rows || 30 },
    React.createElement(ScrollableList, {
      items: listItems,
      selectedIndex: suiteDetailCursor,
      height: rows || 30,
      width: '100%',
      borderColor: hasFailed ? 'red' : 'green',
      focused: true,
    })
  );
}
