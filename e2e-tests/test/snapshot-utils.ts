import { execSync } from 'child_process';
import fs from 'fs';

export function generateSnapshot(workingFolder: string) {
  const results = execSync('find ./cdk.out -name "*.template.json"', {
    cwd: workingFolder,
    env: process.env,
  });

  return results.toString()
    .split('\n')
    .filter(f => f.length > 0)
    .reduce((prev: any, curr: string) => {
      return { ...prev, [curr]: fs.readFileSync(`${workingFolder}/${curr}`).toString() };
    }, {});
}