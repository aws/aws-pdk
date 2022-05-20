import { execSync } from 'child_process';
import path from 'path';
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
      execSync('npx projen new --from @aws/aws-pdk-lib pdk-pipeline-py --no-git --module-name=e2e_python --synth=false', {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });

      const wheelFile = path.join(__dirname, "../../dist/python/aws_prototyping_sdk-0.0.0-py3-none-any.whl");
      execSync(`awk '{sub("\\"@aws/aws-pdk-lib\\"","\\"${wheelFile}\\"")}1' .projenrc.py > temp.txt && mv temp.txt .projenrc.py`, {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });

      execSync(`pip install ${wheelFile} --force-reinstall && python .projenrc.py`,{
        cwd: tempFolder,
        stdio: 'inherit',
      });

      execSync('npx projen build', {
        cwd: tempFolder,
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