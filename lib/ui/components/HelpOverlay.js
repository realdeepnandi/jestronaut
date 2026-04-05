import React from 'react';
import { Box, Text } from 'ink';

const SECTIONS = [
  { heading: 'Navigation', keys: [
    ['Tab',    'Switch focus between Results / Suites'],
    ['j / ↓',  'Move cursor down'],
    ['k / ↑',  'Move cursor up'],
  ]},
  { heading: 'Actions', keys: [
    ['Enter',  'Open suite / test detail'],
    ['Escape', 'Close overlay'],
    ['?',      'Toggle this help overlay'],
    ['q',      'Quit'],
  ]},
  { heading: 'Watch Mode', keys: [
    ['a',      'Run all tests'],
    ['r',      'Re-run failed tests only'],
  ]},
  { heading: 'Detail Overlay', keys: [
    ['j / k',  'Navigate failed tests (suite detail)'],
    ['j / k',  'Scroll content (test detail)'],
  ]},
];

export function HelpOverlay({ rows, columns }) {
  const width = Math.min(62, (columns || 80) - 4);

  return React.createElement(
    Box,
    { height: rows || 24, width: columns || 80, justifyContent: 'center', alignItems: 'center' },
    React.createElement(
      Box,
      { flexDirection: 'column', borderStyle: 'single', borderColor: 'cyan', width, paddingX: 2, paddingY: 1 },
      React.createElement(Text, { bold: true, color: 'cyan' }, 'Keybindings'),
      React.createElement(Box, { height: 1 }),
      ...SECTIONS.flatMap(section => [
        React.createElement(Text, { color: 'yellow', key: section.heading }, section.heading),
        ...section.keys.map(([k, desc]) =>
          React.createElement(
            Box, { key: k },
            React.createElement(Text, { color: 'white' }, `  ${k.padEnd(10)} `),
            React.createElement(Text, { color: 'gray', wrap: 'truncate' }, desc)
          )
        ),
        React.createElement(Box, { height: 1, key: `${section.heading}-spacer` }),
      ]),
      React.createElement(Text, { color: 'gray' }, '[?] or [Esc] to close'),
    )
  );
}
