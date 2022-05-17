import { execSync } from 'child_process';
import { publishPDKToLocalRegistry } from './publish-pdk-to-local-registry';
import { startLocalRegistry } from './start-local-registry';

module.exports = async () => {
  // @ts-ignore
  globalThis.__REGISTRY_PROCESS__ = await startLocalRegistry();
  publishPDKToLocalRegistry();

  // HACK: Projen is using NODE_ENV internally with tests so we need to modify this :(
  // https://github.com/projen/projen/blob/e5899dd04a575209424a08fe90bde99e07ac6c7b/src/common.ts#L5
  process.env.NODE_ENV = '_test';

  execSync('npm install -g aws-cdk', {
    env: process.env,
    stdio: 'inherit',
  });
};