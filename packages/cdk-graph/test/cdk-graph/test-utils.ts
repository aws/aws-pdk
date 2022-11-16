import * as path from "path";
import * as fs from "fs-extra";

export async function makeCdkOutDir(...name: string[]): Promise<string> {
  const dir = path.join(__dirname, "..", ".tmp", ...name, "cdk.out");

  await fs.ensureDir(dir);
  await fs.emptyDir(dir);

  return dir;
}
