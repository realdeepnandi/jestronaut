'use strict';

// CJS proxy for DashboardReporter.
//
// Jest require()s reporters synchronously, but lib/reporter.js → ink → yoga-wasm-web
// uses top-level await (TLA), which Node 22+ rejects with ERR_REQUIRE_ASYNC_MODULE
// instead of ERR_REQUIRE_ESM. Jest 29's requireOrImportModule only catches
// ERR_REQUIRE_ESM and never retries with import(), so it crashes. Jest 30 fixed this.
//
// This proxy keeps the require() entry point CJS-clean while delegating to the real
// ESM reporter via dynamic import(), which handles TLA correctly.
//
// Jest awaits reporter lifecycle methods that return Promises, so async delegates work.

class DashboardReporterProxy {
  constructor(globalConfig) {
    this._ready = import('./lib/reporter.js').then(m => {
      this._delegate = new m.default(globalConfig);
    });
  }

  async onRunStart(results)         { await this._ready; return this._delegate.onRunStart(results); }
  async onTestFileStart(test)       { await this._ready; return this._delegate.onTestFileStart(test); }
  async onTestCaseStart(test, info) { await this._ready; return this._delegate.onTestCaseStart(test, info); }
  async onTestCaseResult(test, r)   { await this._ready; return this._delegate.onTestCaseResult(test, r); }
  async onTestFileResult(test, r)   { await this._ready; return this._delegate.onTestFileResult(test, r); }
  async onRunComplete(ctx, results) { await this._ready; return this._delegate.onRunComplete(ctx, results); }
}

module.exports = DashboardReporterProxy;
