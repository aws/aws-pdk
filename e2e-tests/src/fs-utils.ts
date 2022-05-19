import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Executes the provided function within the context of a temp folder.
 *
 * @param testCase name of the testcase to execute.
 * @param executor custom code to execute within the tmp folder.
 */
export const executeInTempFolderSync = (testCase: string, executor: (tempFolder: string) => void) => {
  const tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), testCase));

  try {
    executor(tempFolder);
  } finally {
    // fs.rmSync(tempFolder, { recursive: true });
  }
};