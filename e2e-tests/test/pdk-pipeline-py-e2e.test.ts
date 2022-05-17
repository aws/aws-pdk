import { execSync } from 'child_process';
import { executeInTempFolderSync } from '../src/fs-utils';

/**
 * Series of End to End tests.
 */
describe('pdk-pipeline-py E2E Tests', () => {

  /**
   * Test to ensure we can instantiate a pdk-pipeline-py construct and it
   * builds successfully.
   */
  it('pdk-pipeline-py-create', async () => {
    executeInTempFolderSync('pdk-pipeline-py-create', (tempFolder) => {
      execSync('npx projen new --from aws-prototyping-sdk pdk-pipeline-py --no-git --module-name=e2e_python', {
        cwd: tempFolder,
        env: process.env, // This is important to make sure we use the local registry!
        stdio: 'inherit',
      });

      // TODO: Uncomment once this is published: https://github.com/aws/jsii/commit/8ef8ef2fe1e5559ef77a5b7ba0dbb67f52329927

      // verify it builds successfully
      // execSync('npx projen build', {
      //   cwd: tempFolder,
      //   env: process.env,
      //   stdio: 'inherit',
      // });
    });
  });
});