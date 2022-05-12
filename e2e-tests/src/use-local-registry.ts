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