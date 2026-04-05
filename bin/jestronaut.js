#!/usr/bin/env node

// If stdout is not a TTY (CI, piped output, etc.), skip the TUI entirely
// and let Jest run with its default reporter.
if (!process.stdout.isTTY) {
  const { run } = await import('jest');
  run();
  process.exit();
}

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

// Block Jest's watch mode from turning off raw mode while the TUI is active.
// ink manages raw mode itself — we only prevent Jest from disabling it mid-run.
const realSetRawMode = process.stdin.setRawMode && process.stdin.setRawMode.bind(process.stdin);
if (realSetRawMode) {
  process.stdin.setRawMode = (val) => {
    // Allow enabling raw mode always (ink may call this multiple times).
    // Block disabling raw mode when the TUI is holding input focus.
    if (!val && global.__jestronaut_block_jest_input__) {
      return process.stdin;
    }
    return realSetRawMode(val);
  };
}

// Gate Jest's stdin keypresses using EventEmitter.prototype.emit patch.
// This is more reliable than patching stdin.on because Node's stream internals
// may bypass a patched .on() after setEncoding() is called.
const realEmit = process.stdin.emit.bind(process.stdin);
global.__jestronaut_emit__ = realEmit;

const _origEmit = process.stdin.emit;
process.stdin.emit = function(event, ...args) {
  if (event === 'data' && global.__jestronaut_block_jest_input__) return true;
  return _origEmit.apply(this, [event, ...args]);
};

// Global contract for watch mode:
//   __jestronaut_ui__                    — { store, unmount } created once, reused across re-runs
//   __jestronaut_block_jest_input__      — boolean; true when TUI holds input focus
//   __jestronaut_jest_keypress__         — Jest's raw onKeypress listener (unwrapped)
//   __jestronaut_emit__                  — original process.stdin.emit before any patching

// Forward all CLI args so flags like --testPathPattern, --watch etc. still work
const { run } = await import('jest');
run();
