import { render } from 'ink';
import React from 'react';
import { JestronautStore } from './store.js';
import { Dashboard } from './components/Dashboard.js';

export function createApp() {
  if (global.__jestronaut_ui__) {
    return global.__jestronaut_ui__;
  }

  const store = new JestronautStore();
  const { unmount } = render(
    React.createElement(Dashboard, { store }),
    { exitOnCtrlC: false }
  );

  const ui = { store, unmount };
  global.__jestronaut_ui__ = ui;
  return ui;
}
