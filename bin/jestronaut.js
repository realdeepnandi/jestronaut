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

// Forward all CLI args so flags like --testPathPattern, --watch etc. still work
const { run } = require('jest');
run();
