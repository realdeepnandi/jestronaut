import React from 'react';
import { Box, Text } from 'ink';

export function computeScrollOffset(selectedIndex, visibleHeight, totalItems) {
  if (totalItems === 0 || visibleHeight <= 0) return 0;
  const maxOffset = Math.max(0, totalItems - visibleHeight);
  const offset = Math.max(0, selectedIndex - Math.floor(visibleHeight / 2));
  return Math.min(offset, maxOffset);
}

export function ScrollableList({ items, selectedIndex, height, width, borderColor, focused }) {
  const innerHeight = Math.max(1, (height || 10) - 2);
  const scrollOffset = computeScrollOffset(selectedIndex, innerHeight, items.length);
  const visible = items.slice(scrollOffset, scrollOffset + innerHeight);

  return React.createElement(
    Box,
    { flexDirection: 'column', borderStyle: 'single', borderColor: borderColor || 'white', width: width || '100%', height: height || 10 },
    visible.map((item, i) => {
      const absIndex = scrollOffset + i;
      const isSelected = absIndex === selectedIndex && focused;
      const bg = item.bg || (isSelected ? '#2a2a6a' : undefined);
      return React.createElement(
        Box,
        { key: absIndex, paddingLeft: 1, paddingRight: 1, width: '100%', backgroundColor: bg },
        React.createElement(Text, { color: item.color, backgroundColor: bg, wrap: 'truncate' }, item.text || '')
      );
    })
  );
}
