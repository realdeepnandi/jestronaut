import React from 'react';
import { Box, Text } from 'ink';

export function Stats({ stats }) {
  return React.createElement(
    Box,
    { height: 2, backgroundColor: '#111133', justifyContent: 'center', alignItems: 'center', gap: 4 },
    React.createElement(Text, { color: 'green', bold: true }, `PASSED: ${stats.passed}`),
    React.createElement(Text, { color: 'red',   bold: true }, `FAILED: ${stats.failed}`),
    React.createElement(Text, { color: 'yellow',bold: true }, `SKIPPED: ${stats.skipped}`),
    React.createElement(Text, { color: 'white'           }, `TOTAL: ${stats.total}`)
  );
}
