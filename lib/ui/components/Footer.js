import React from 'react';
import { Box, Text } from 'ink';
import { SPINNER } from '../../constants.js';

export function Footer({ state }) {
  const { stats, testDetailOpen, suiteDetailOpen, watchWaiting, spinFrame, suites } = state;
  const elapsed = stats.startTime
    ? (((stats.endTime || Date.now()) - stats.startTime) / 1000).toFixed(1) + 's'
    : '0.0s';
  const runningCount = Object.values(suites).filter(s => !s.done).length;
  const spin = SPINNER[spinFrame % SPINNER.length];

  let hint;
  if (testDetailOpen)       hint = '[Esc] close   [j/k] scroll';
  else if (suiteDetailOpen) hint = '[j/k] navigate failed   [Enter] open failure   [Esc] back';
  else if (watchWaiting)    hint = '[a] run all tests   [q] quit';
  else                      hint = '[Tab] switch panel   [j/k] navigate   [Enter] open failure   [q] quit';

  const statusText = runningCount > 0
    ? `${spin} Running ${runningCount} suite${runningCount > 1 ? 's' : ''}...`
    : `Elapsed: ${elapsed}`;

  return React.createElement(
    Box,
    { height: 3, backgroundColor: '#111133', flexDirection: 'column', justifyContent: 'center', paddingLeft: 2 },
    React.createElement(
      Box,
      { justifyContent: 'space-between' },
      React.createElement(Text, { color: 'cyan' }, hint),
      React.createElement(Text, { color: 'gray' }, statusText)
    )
  );
}
