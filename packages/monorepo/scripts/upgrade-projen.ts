import * as ncu from "npm-check-updates";
import * as fs from "fs";
import * as path from "path";

(async () => {
  // Get the latest minor version update of projen
  const { projen } = await ncu.run({
    jsonUpgraded: true,
    target: "minor",
    filter: "projen",
  }) as any;

  // Write the projen version to projen-version.ts
  fs.writeFileSync(path.resolve(__dirname, "../src/components/projen-version.ts"), `export default "^${projen}";`);
})();
