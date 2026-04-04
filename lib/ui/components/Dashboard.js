import React, { useState, useEffect, useReducer } from 'react';
import { Box, useInput, useApp, useStdout } from 'ink';
import { SPINNER } from '../../constants.js';
import { Header } from './Header.js';
import { Stats } from './Stats.js';
import { Progress } from './Progress.js';
import { ResultsList } from './ResultsList.js';
import { SuitesList } from './SuitesList.js';
import { Footer } from './Footer.js';
import { SuiteDetailOverlay, buildSuiteDetailItems, moveCursor as moveSuiteDetailCursor } from './SuiteDetailOverlay.js';
import { TestDetailOverlay, buildLines as buildTestDetailLines } from './TestDetailOverlay.js';

const FIXED_ROWS = 2 + 2 + 2 + 3; // header + stats + progress + footer

export function Dashboard({ store }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [dims, setDims] = useState({ columns: stdout.columns || 80, rows: stdout.rows || 24 });
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const onResize = () => setDims({ columns: stdout.columns || 80, rows: stdout.rows || 24 });
    stdout.on('resize', onResize);
    return () => stdout.off('resize', onResize);
  }, [stdout]);

  const { columns, rows } = dims;

  useEffect(() => {
    store.on('update', forceUpdate);
    return () => store.off('update', forceUpdate);
  }, [store]);

  useEffect(() => {
    global.__jestronaut_block_jest_input__ = true;
    return () => { global.__jestronaut_block_jest_input__ = false; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (store.state.runComplete && !store.state.watchWaiting) return;
      store.state.spinFrame = (store.state.spinFrame + 1) % SPINNER.length;
      store.notify();
    }, 120);
    return () => clearInterval(id);
  }, [store]);

  const state = store.state;

  useInput((input, key) => {
    const s = store.state;

    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
      process.exit(0);
    }

    if (input === 'a' && s.watchWaiting) {
      // Briefly unblock, forward 'a' to Jest's watch listener, then re-block
      global.__jestronaut_block_jest_input__ = false;
      if (global.__jestronaut_emit__) global.__jestronaut_emit__('data', 'a');
      global.__jestronaut_block_jest_input__ = true;
      return;
    }

    if (key.tab && !s.suiteDetailOpen && !s.testDetailOpen) {
      s.focus = s.focus === 'results' ? 'suites' : 'results';
      store.notify();
      return;
    }

    if (key.upArrow || input === 'k') {
      if (s.testDetailOpen) {
        s.testDetailScrollOffset = Math.max(0, (s.testDetailScrollOffset || 0) - 1);
      } else if (s.suiteDetailOpen) {
        moveSuiteDetailCursor(s, -1);
      } else if (s.focus === 'results') {
        if (!s.resultItems.length) return;
        s.resultCursor = s.resultCursor <= 0 ? s.resultItems.length - 1 : s.resultCursor - 1;
      } else {
        if (!s.suiteOrder.length) return;
        s.suiteCursor = s.suiteCursor <= 0 ? s.suiteOrder.length - 1 : s.suiteCursor - 1;
      }
      store.notify();
      return;
    }

    if (key.downArrow || input === 'j') {
      if (s.testDetailOpen) {
        const totalLines = s.testDetailFailure ? buildTestDetailLines(s.testDetailFailure, s.stats).length : 0;
        const innerHeight = Math.max(1, rows - 2);
        const maxOffset = Math.max(0, totalLines - innerHeight);
        s.testDetailScrollOffset = Math.min(maxOffset, (s.testDetailScrollOffset || 0) + 1);
      } else if (s.suiteDetailOpen) {
        moveSuiteDetailCursor(s, 1);
      } else if (s.focus === 'results') {
        if (!s.resultItems.length) return;
        s.resultCursor = s.resultCursor >= s.resultItems.length - 1 ? 0 : s.resultCursor + 1;
      } else {
        if (!s.suiteOrder.length) return;
        s.suiteCursor = s.suiteCursor >= s.suiteOrder.length - 1 ? 0 : s.suiteCursor + 1;
      }
      store.notify();
      return;
    }

    if (key.return) {
      if (s.testDetailOpen) return;
      if (s.suiteDetailOpen) {
        const item = s.suiteDetailItems[s.suiteDetailCursor];
        if (item && item.type === 'test' && item.failureObj) {
          s.testDetailOpen = true;
          s.testDetailFailure = item.failureObj;
          s.testDetailScrollOffset = 0;
          store.notify();
        }
        return;
      }
      if (s.focus === 'results') {
        if (s.resultCursor < 0 || s.resultCursor >= s.resultMeta.length) return;
        const meta = s.resultMeta[s.resultCursor];
        if (meta.status !== 'failed') return;
        s.testDetailOpen = true;
        s.testDetailFailure = s.failures[meta.failureIndex];
        s.testDetailScrollOffset = 0;
      } else {
        if (!s.suiteOrder.length) return;
        const path = s.suiteOrder[s.suiteCursor];
        if (!path) return;
        const result = buildSuiteDetailItems(s.suites[path], path);
        s.suiteDetailOpen = true;
        s.suiteDetailPath = path;
        s.suiteDetailItems = result.items;
        s.suiteDetailCursor = result.items.findIndex(m => m.type === 'test' && m.failureObj);
        if (s.suiteDetailCursor < 0) s.suiteDetailCursor = 0;
      }
      store.notify();
      return;
    }

    if (key.escape) {
      if (s.testDetailOpen) {
        s.testDetailOpen = false;
        s.testDetailFailure = null;
        s.testDetailScrollOffset = 0;
      } else if (s.suiteDetailOpen) {
        s.suiteDetailOpen = false;
        s.suiteDetailPath = null;
        s.suiteDetailItems = [];
        s.suiteDetailCursor = 0;
      }
      store.notify();
    }
  });

  if (state.testDetailOpen) {
    return React.createElement(TestDetailOverlay, { state, rows });
  }
  if (state.suiteDetailOpen) {
    return React.createElement(SuiteDetailOverlay, { state, rows });
  }

  const listHeight = Math.max(4, rows - FIXED_ROWS);

  return React.createElement(
    Box,
    { flexDirection: 'column', height: rows, width: columns },
    React.createElement(Header, { state }),
    React.createElement(Stats, { stats: state.stats }),
    React.createElement(Progress, { stats: state.stats, width: columns }),
    React.createElement(
      Box,
      { flexDirection: 'row', height: listHeight },
      React.createElement(Box, { width: '65%' }, React.createElement(ResultsList, { state, height: listHeight })),
      React.createElement(Box, { width: '35%' }, React.createElement(SuitesList,  { state, height: listHeight }))
    ),
    React.createElement(Footer, { state })
  );
}
