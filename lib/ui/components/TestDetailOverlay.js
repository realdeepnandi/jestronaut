import React from 'react';
import { Box } from 'ink';
import { ScrollableBox } from './ScrollableBox.js';

export function buildLines(failure, stats) {
  const rawMsg = (failure.messages || []).join('\n');
  const expectedMatch = rawMsg.match(/Expected[:\s]+(.+)/);
  const receivedMatch = rawMsg.match(/Received[:\s]+(.+)/);
  const stackLines = rawMsg.split('\n').filter(l => l.trim().startsWith('at ')).map(l => l.trim());

  const lines = [
    { text: `FAILED: ${failure.suiteName} > ${failure.title}`, color: 'red' },
    { text: '' },
    { text: `Suite   :  ${failure.suiteName}`, color: 'yellow' },
    { text: `Test    :  ${failure.title}`,     color: 'yellow' },
    { text: `Duration:  ${failure.duration != null ? failure.duration + 'ms' : 'N/A'}`, color: 'yellow' },
    { text: '' },
    { text: '── Error Message ──────────────────────────────────────────', color: 'cyan' },
    { text: '' },
  ];

  if (expectedMatch) lines.push({ text: `  Expected:  ${expectedMatch[1].trim()}`, color: 'green' });
  if (receivedMatch) lines.push({ text: `  Received:  ${receivedMatch[1].trim()}`, color: 'red' });

  lines.push({ text: '' });
  rawMsg.split('\n').slice(0, 15).forEach(l =>
    lines.push({ text: `  ${l.replace(/\{/g, '(').replace(/\}/g, ')')}`, color: 'white' })
  );

  lines.push(
    { text: '' },
    { text: '── Stack Trace ─────────────────────────────────────────────', color: 'cyan' },
    { text: '' }
  );

  if (stackLines.length > 0) {
    const firstUser = stackLines.findIndex(l => !l.includes('node_modules'));
    stackLines.forEach((l, i) =>
      lines.push({ text: `  ${i === firstUser ? '> ' : '  '}${l}`, color: i === firstUser ? 'yellow' : 'gray' })
    );
  } else {
    lines.push({ text: '  (no stack trace)', color: 'gray' });
  }

  lines.push(
    { text: '' },
    { text: '── Run Metrics ─────────────────────────────────────────────', color: 'cyan' },
    { text: '' },
    { text: `  Passed  :  ${stats.passed}`,  color: 'green' },
    { text: `  Failed  :  ${stats.failed}`,  color: 'red' },
    { text: `  Skipped :  ${stats.skipped}`, color: 'yellow' },
    { text: `  Elapsed :  ${(((stats.endTime || Date.now()) - stats.startTime) / 1000).toFixed(1)}s`, color: 'white' },
    { text: '' },
    { text: '  [Esc] back   [j/k] scroll', color: 'gray' }
  );

  return lines;
}

export function TestDetailOverlay({ state, rows }) {
  const { testDetailFailure, testDetailScrollOffset, stats } = state;
  if (!testDetailFailure) return null;
  const lines = buildLines(testDetailFailure, stats);
  return React.createElement(
    Box,
    { flexDirection: 'column', height: rows || 30 },
    React.createElement(ScrollableBox, {
      lines,
      scrollOffset: testDetailScrollOffset,
      height: rows || 30,
      width: '100%',
      borderColor: 'red',
    })
  );
}
