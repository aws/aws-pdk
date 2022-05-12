import { execSync } from 'child_process';
import { executeInTempFolderSync } from '../src/fs-utils';

/**
 * Series of End to End tests.
 */
describe('nx-monorepo E2E Tests', () => {

  /**
   * Test to ensure we can instantiate a new monorepo projen construct and it
   * builds successfully.
   */
  it('nx-monorepo-create', async () => {
    executeInTempFolderSync('nx-monorepo-create', (tempFolder) => {
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
});