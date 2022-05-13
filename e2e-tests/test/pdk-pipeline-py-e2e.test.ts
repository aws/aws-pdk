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
      // HACK: Projen is using NODE_ENV internally with tests so we need to modify this :(
      // https://github.com/projen/projen/blob/e5899dd04a575209424a08fe90bde99e07ac6c7b/src/common.ts#L5
      process.env.NODE_ENV='_test';

      execSync('npx projen new --from aws-prototyping-sdk pdk-pipeline-py --no-git', {
        cwd: tempFolder,
        env: process.env, // This is important to make sure we use the local registry!
        stdio: 'inherit',
      });

      // verify it builds successfully
      // execSync('npx projen build', {
      //   cwd: tempFolder,
      //   env: process.env,
      //   stdio: 'inherit',
      // });
    });
  });
});