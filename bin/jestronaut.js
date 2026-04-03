#!/usr/bin/env node
'use strict';

// Intercept stdout/stderr before Jest loads anything so its early
// output ("Determining test suites...") doesn't bleed into the TUI.
const realStdout = process.stdout.write.bind(process.stdout);
const realStderr = process.stderr.write.bind(process.stderr);

const SUPPRESS = [
  'Determining test suites',
  'localstorage-file',
  'ExperimentalWarning',
  'trace-warnings',
  'Jest did not exit',
  'detectOpenHandles',
  'asynchronous operations',
  'Watch Usage',
  'Press `',
  'Press a',
  'Press f',
  'Press p',
  'Press t',
  'Press q',
  'Press Enter',
  'No tests found',
  'ran all test suites',
  'Ran all test suites',
];

function shouldSuppress(chunk) {
  const s = chunk.toString();
  return SUPPRESS.some(kw => s.includes(kw));
}

process.stdout.write = (chunk, enc, cb) => {
  if (!shouldSuppress(chunk)) return realStdout(chunk, enc, cb);
  if (typeof enc === 'function') enc(); else if (typeof cb === 'function') cb();
  return true;
};

process.stderr.write = (chunk, enc, cb) => {
  if (!shouldSuppress(chunk)) return realStderr(chunk, enc, cb);
  if (typeof enc === 'function') enc(); else if (typeof cb === 'function') cb();
  return true;
};

// Clear terminal before handing off to Jest
realStdout('\x1b[2J\x1b[H');

// Block Jest's watch mode from stealing raw TTY control from blessed.
// Blessed will call setRawMode itself when the screen is created in the reporter.
// We block ALL subsequent calls after that so Jest can't interfere.
const realSetRawMode = process.stdin.setRawMode && process.stdin.setRawMode.bind(process.stdin);
if (realSetRawMode) {
  let rawModeSet = false;
  process.stdin.setRawMode = (val) => {
    if (!rawModeSet && val) {
      rawModeSet = true;
      return realSetRawMode(val);
    }
    if (!val) {
      // allow turning off (e.g. on exit)
      rawModeSet = false;
      return realSetRawMode(val);
    }
    return process.stdin;
  };
}


// Intercept stdin data events: when TUI is active, only dispatch to blessed's
// listeners — skip Jest's watch mode listener so it doesn't trigger a re-run.
const realEmit = process.stdin.emit.bind(process.stdin);
process.stdin.emit = (event, ...args) => {
  if (event === 'data' && global.__jestronaut_block_jest_input__ && global.__jestronaut_blessed_listeners__) {
    // Call only blessed's listeners, skip Jest's
    global.__jestronaut_blessed_listeners__.forEach(l => l(...args));
    return true;
  }
  return realEmit(event, ...args);
};

// Forward all CLI args so flags like --testPathPattern, --watch etc. still work
const { run } = require('jest');
run();
