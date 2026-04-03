#!/usr/bin/env node
// Intercept ALL stdout/stderr before Jest loads anything
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
  if (!shouldSuppress(chunk)) realStdout(chunk, enc, cb);
  else if (typeof enc === 'function') enc(); else if (typeof cb === 'function') cb();
  return true;
};
process.stderr.write = (chunk, enc, cb) => {
  if (!shouldSuppress(chunk)) realStderr(chunk, enc, cb);
  else if (typeof enc === 'function') enc(); else if (typeof cb === 'function') cb();
  return true;
};

// Clear screen before Jest starts
realStdout('\x1b[2J\x1b[H');

// Now launch Jest programmatically
const { run } = require('jest');
run();
