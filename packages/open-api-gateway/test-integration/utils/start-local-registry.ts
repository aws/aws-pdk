import { fork, ChildProcess } from 'child_process';
import * as path from 'path';

/**
 * Starts a local instance of Verdaccio (NPM registry).
 *
 * @return a promise of a ChildProcess.
 */
export const startLocalRegistry: () => Promise<ChildProcess> = () => new Promise((resolve, reject) => {
  const pathVerdaccioModule = require.resolve('verdaccio/bin/verdaccio');
  const configPath = path.join(__dirname, 'config.yaml');
  //
  process.env.VERDACCIO_HANDLE_KILL_SIGNALS = "true";
  const childFork = fork(
    pathVerdaccioModule,
    ['-c', configPath],
    { silent: false, detached: true },
  );

  childFork.on('message', (msg: string[]) => {
    if ('verdaccio_started' in msg) {
      resolve(childFork);
    }
  });

  childFork.on('error', (err) => {
    reject([err]);
  });

  childFork.on('exit', (err) => {
    reject([err]);
  });
});
