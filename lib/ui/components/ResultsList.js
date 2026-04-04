import React from 'react';
import { ScrollableList } from './ScrollableList.js';

export function buildItems(resultItems) {
  return resultItems.map(item => {
    let text = `[${item.icon}] `;
    if (item.ancestor) text += `${item.ancestor} > `;
    text += item.title;
    if (item.duration != null) text += ` (${item.duration}ms)`;
    if (item.isFailed) text += ' [Enter]';
    return { text, color: item.titleColor };
  });
}

export function ResultsList({ state, height }) {
  const { resultItems, resultCursor, focus } = state;
  const focused = focus === 'results';
  return React.createElement(ScrollableList, {
    items: buildItems(resultItems),
    selectedIndex: resultCursor,
    height,
    width: '100%',
    borderColor: focused ? 'cyan' : 'gray',
    focused,
  });
}
