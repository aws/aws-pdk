import { ChildProcess, execSync } from 'child_process';
import { executeInTempFolderSync } from '../src/fs-utils';
import { publishPDKToLocalRegistry } from '../src/publish-pdk-to-local-registry';
import { startLocalRegistry } from '../src/start-local-registry';

/**
 * Series of End to End tests.
 */
describe('E2E Tests', () => {
  let registryProcess: ChildProcess | undefined;

  /**
   * Start the local npm registry and publish the PDK locally
   */
  beforeAll(async () => {
    registryProcess = await startLocalRegistry();
    await publishPDKToLocalRegistry();
  });

  /**
   * Test to ensure we can instantiate a new monorepo projen construct and it
   * builds successfully.
   */
  it('nx-monorepo-create', async () => {
    executeInTempFolderSync('run-e2e', (tempFolder) => {
      execSync('npx projen new --from aws-prototyping-sdk nx-monorepo', {
        cwd: tempFolder,
        env: process.env, // This is important to make sure we use the local registry!
        stdio: 'inherit',
      });

      // verify it builds successfully
      execSync('npx nx run-many --target=build --all ', {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });
    });
  });

  /**
   * Kill the local registry once we are done
   */
  afterAll(() => registryProcess && registryProcess.kill());
});