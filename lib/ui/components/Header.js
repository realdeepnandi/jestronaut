import React from 'react';
import { Box, Text } from 'ink';

export function Header({ state }) {
  const { runComplete, runOk, runElapsed } = state;
  let content, bg;
  if (runComplete) {
    content = runOk ? `ALL TESTS PASSED — ${runElapsed}s` : `SOME TESTS FAILED — ${runElapsed}s`;
    bg = runOk ? 'green' : 'red';
  } else {
    content = 'JEST TEST DASHBOARD';
    bg = 'blue';
  }
  return React.createElement(
    Box,
    { height: 2, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
    React.createElement(Text, { bold: true, color: 'white' }, content)
  );
}
