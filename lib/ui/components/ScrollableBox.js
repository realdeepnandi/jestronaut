import React from 'react';
import { Box, Text } from 'ink';

export function ScrollableBox({ lines, scrollOffset, height, width, borderColor }) {
  const innerHeight = Math.max(1, (height || 10) - 2);
  const offset = Math.max(0, Math.min(scrollOffset || 0, Math.max(0, lines.length - innerHeight)));
  const visible = lines.slice(offset, offset + innerHeight);

  return React.createElement(
    Box,
    { flexDirection: 'column', borderStyle: 'single', borderColor: borderColor || 'red', width: width || '100%', height: height || 10 },
    visible.map((line, i) =>
      React.createElement(
        Box,
        { key: offset + i, paddingLeft: 2 },
        React.createElement(Text, { color: line.color, wrap: 'truncate' }, line.text || '')
      )
    )
  );
}
