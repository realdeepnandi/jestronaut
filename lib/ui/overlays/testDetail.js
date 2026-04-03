'use strict';

const blessed = require('blessed');

function createTestDetail(screen) {
  const widget = blessed.box({
    top: '8%', left: '8%', width: '84%', height: '84%',
    label: ' Test Failure Detail ',
    border: { type: 'line' },
    tags: true, scrollable: true, alwaysScroll: true,
    keys: true, vi: true,
    scrollbar: { ch: '|', style: { fg: 'red' } },
    style: {
      border: { fg: 'red' }, label: { fg: 'red', bold: true },
      bg: '#0d0000', fg: 'white',
    },
    padding: { left: 2, right: 2, top: 1, bottom: 1 },
    hidden: true,
  });
  screen.append(widget);
  return widget;
}

function openTestDetail(widget, failure, stats) {
  const rawMsg = (failure.messages || []).join('\n');
  const expectedMatch = rawMsg.match(/Expected[:\s]+(.+)/);
  const receivedMatch = rawMsg.match(/Received[:\s]+(.+)/);
  const stackLines = rawMsg.split('\n')
    .filter(l => l.trim().startsWith('at '))
    .map(l => l.trim());

  const lines = [
    `{red-fg}{bold}FAILED: ${failure.suiteName} > ${failure.title}{/bold}{/red-fg}`,
    '',
    `{yellow-fg}Suite   :{/yellow-fg}  ${failure.suiteName}`,
    `{yellow-fg}Test    :{/yellow-fg}  ${failure.title}`,
    `{yellow-fg}Duration:{/yellow-fg}  ${failure.duration != null ? failure.duration + 'ms' : 'N/A'}`,
    '',
    '{cyan-fg}── Error Message ──────────────────────────────────────────────────{/cyan-fg}',
    '',
  ];

  if (expectedMatch) lines.push(`  {green-fg}Expected:{/green-fg}  ${expectedMatch[1].trim()}`);
  if (receivedMatch) lines.push(`  {red-fg}Received:{/red-fg}  ${receivedMatch[1].trim()}`);

  lines.push('');
  rawMsg.split('\n').slice(0, 15).forEach(l =>
    lines.push(`  ${l.replace(/\{/g, '(').replace(/\}/g, ')')}`)
  );

  lines.push(
    '',
    '{cyan-fg}── Stack Trace ─────────────────────────────────────────────────────{/cyan-fg}',
    '',
  );

  if (stackLines.length > 0) {
    const firstUser = stackLines.findIndex(l => !l.includes('node_modules'));
    stackLines.forEach((l, i) => {
      if (i === firstUser) lines.push(`  {yellow-fg}> ${l}{/yellow-fg}`);
      else lines.push(`  {grey-fg}${l}{/grey-fg}`);
    });
  } else {
    lines.push('  {grey-fg}(no stack trace){/grey-fg}');
  }

  lines.push(
    '',
    '{cyan-fg}── Run Metrics ─────────────────────────────────────────────────────{/cyan-fg}',
    '',
    `  {white-fg}Passed  :{/white-fg}  {green-fg}${stats.passed}{/green-fg}`,
    `  {white-fg}Failed  :{/white-fg}  {red-fg}${stats.failed}{/red-fg}`,
    `  {white-fg}Skipped :{/white-fg}  {yellow-fg}${stats.skipped}{/yellow-fg}`,
    `  {white-fg}Elapsed :{/white-fg}  ${((Date.now() - stats.startTime) / 1000).toFixed(1)}s`,
    '',
    '{grey-fg}  [Esc] back   [j/k] scroll{/grey-fg}',
  );

  widget.setLabel(` Test Failure: ${failure.title} `);
  widget.setContent(lines.join('\n'));
  widget.scrollTo(0);
  widget.show();
}

module.exports = { createTestDetail, openTestDetail };
