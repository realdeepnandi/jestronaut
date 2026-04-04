import React from 'react';
import { SPINNER } from '../../constants.js';
import { ScrollableList } from './ScrollableList.js';

function buildItems(state) {
  const { suiteOrder, suites, focus, suiteCursor, suiteDetailOpen, testDetailOpen, spinFrame } = state;
  const spin = SPINNER[spinFrame % SPINNER.length];

  if (suiteOrder.length === 0) return [{ text: 'waiting...' }];

  return suiteOrder.map((path, i) => {
    const s = suites[path];
    const name = path.split('/').pop().replace(/\.test\.[jt]sx?$/, '');
    const elapsed = s.startTime ? ` ${((Date.now() - s.startTime) / 1000).toFixed(1)}s` : '';
    const prefix = s.done ? (s.failed > 0 ? 'FAIL' : 'PASS') : spin;
    const counts = ` [${s.passed}p ${s.failed}f]`;
    const isCursor = focus === 'suites' && !suiteDetailOpen && !testDetailOpen && i === suiteCursor;
    const hint = isCursor ? ' [Enter]' : '';
    const running = s.running && s.running.size > 0 ? ' > ' + [...s.running].join(', ') : '';
    return {
      text: `${prefix} ${name}${s.done ? counts : elapsed + counts}${hint}${running}`,
      color: s.done ? (s.failed > 0 ? 'red' : 'green') : 'yellow',
    };
  });
}

export function SuitesList({ state, height }) {
  const focused = state.focus === 'suites';
  return React.createElement(ScrollableList, {
    items: buildItems(state),
    selectedIndex: state.suiteCursor,
    height,
    width: '100%',
    borderColor: focused ? 'white' : 'magenta',
    focused,
  });
}
