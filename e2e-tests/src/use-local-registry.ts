import { execSync, ChildProcess } from 'child_process';
import { publishPDKToLocalRegistry } from './publish-pdk-to-local-registry';
import { startLocalRegistry } from './start-local-registry';

/**
 * Configures common setup and teardown for using PDK from a local registry.
 */
export const useLocalRegistry = async () => {
  let registryProcess: ChildProcess | undefined;

  try {
    registryProcess = await startLocalRegistry();
    await publishPDKToLocalRegistry();

    // HACK: Projen is using NODE_ENV internally with tests so we need to modify this :(
    // https://github.com/projen/projen/blob/e5899dd04a575209424a08fe90bde99e07ac6c7b/src/common.ts#L5
    process.env.NODE_ENV='_test';

    execSync('npm install -g aws-cdk', {
      env: process.env,
      stdio: 'inherit',
    });

    execSync('jest --passWithNoTests --all --updateSnapshot', {
      env: process.env,
      stdio: 'inherit',
    });
  } finally {
    //Kill the local registry once we are done
    registryProcess && registryProcess.kill();
  }
};

(async () => useLocalRegistry())().catch((e) => {
  console.error(e);
  process.exit(1);
});