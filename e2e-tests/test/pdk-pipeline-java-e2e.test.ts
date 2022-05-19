import { execSync } from 'child_process';
import { executeInTempFolderSync } from '../src/fs-utils';

/**
 * Series of End to End tests.
 */
describe('pdk-pipeline-java E2E Tests', () => {

  /**
   * Test to ensure we can instantiate a pdk-pipeline-java construct and it
   * builds successfully.
   */
  it('pdk-pipeline-java-create', async () => {
    executeInTempFolderSync('pdk-pipeline-java-create', (tempFolder) => {
      execSync('npx projen new --from @aws/aws-pdk-lib pdk-pipeline-java --no-git --name pdk-pipeline-java-create', {
        cwd: tempFolder,
        env: process.env, // This is important to make sure we use the local registry!
        stdio: 'inherit',
      });

      // verify it builds successfully
      execSync('npx projen build', {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });
    });
  });
});