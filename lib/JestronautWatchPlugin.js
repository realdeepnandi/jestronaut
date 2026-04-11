/**
 * Jest watch plugin that intercepts updateConfigAndRun from Jest's watch loop.
 * Activated by sending a null byte (\x00) via stdin — never triggered by real user input.
 * Once activated, calls updateConfigAndRun with the desired config and resolves immediately.
 */
export default class JestronautWatchPlugin {
  getUsageInfo() {
    return { key: '\x00', prompt: '' };
  }

  onKey() {}

  run(_globalConfig, updateConfigAndRun) {
    global.__jestronaut_update_config_and_run__ = updateConfigAndRun;
    const opts = global.__jestronaut_run_opts__;
    global.__jestronaut_run_opts__ = null;
    if (opts) {
      updateConfigAndRun(opts);
    }
    return Promise.resolve(false);
  }
}
