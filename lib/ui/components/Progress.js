import React from 'react';
import { Box, Text } from 'ink';

export function Progress({ stats, width }) {
  const total    = stats.suites || 1;
  const done     = stats.suitesCompleted || 0;
  const barWidth = Math.max(10, (width || 80) - 20);
  const filled   = Math.round((done / total) * barWidth);
  const empty    = barWidth - filled;
  const pct      = Math.round((done / total) * 100);
  const color    = stats.failed > 0 ? 'red' : done === total ? 'green' : 'cyan';
  const bar      = '#'.repeat(filled) + '-'.repeat(empty);

  return React.createElement(
    Box,
    { height: 2, backgroundColor: '#111133', alignItems: 'center', paddingLeft: 2, gap: 1 },
    React.createElement(Text, { color: 'white' }, `Suites ${done}/${total}`),
    React.createElement(Text, { color },          `[${bar}]`),
    React.createElement(Text, { color },          `${pct}%`)
  );
}
