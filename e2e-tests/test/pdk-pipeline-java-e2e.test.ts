import { execSync } from 'child_process';
import { executeInTempFolderSync } from '../src/fs-utils';
import { generateSnapshot } from './snapshot-utils';

/**
 * Series of End to End tests.
 */
describe('pdk-pipeline-java E2E Tests', () => {

  /**
   * Test to ensure we can instantiate a pdk-pipeline-java construct and it
   * builds successfully.
   */
  it('pdk-pipeline-java-create', async () => {
    executeInTempFolderSync('pdk-pipeline-ts-create', (tempFolder) => {
      execSync('npx projen new --from aws-prototyping-sdk pdk-pipeline-java --no-git', {
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

      expect(generateSnapshot(tempFolder)).toMatchSnapshot();
    });
  });
});