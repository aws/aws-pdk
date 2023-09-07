/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
import * as os from "node:os";
import * as fs from "fs-extra";
import * as path from "node:path";
import execa = require("execa"); // eslint-disable-line @typescript-eslint/no-require-imports

/** Directory where generated files are output */
export const GENERATED_DIR = path.resolve(__dirname, "..", "..", "src", "generated");
fs.ensureDirSync(GENERATED_DIR);

// use current head hash to enable reuse of downloaded files
const BASE_TMP_DIR = path.join(
  os.tmpdir(),
  "@aws",
  execa.commandSync("git rev-parse --short HEAD").stdout
);
/** Directory where this package stores external resources */
export const TMP_DIR = path.join(BASE_TMP_DIR, "aws-arch");
fs.ensureDirSync(TMP_DIR);

/** Countable type that can be counted */
export type TCountable = number | object | any[] | Set<any>;

/** Log count to console */
export function logCount(
  title: string,
  total: TCountable,
  count: TCountable,
  delta: boolean = false
): void {
  total = parseCount(total);
  count = parseCount(count);
  if (delta) {
    count = total - count;
  }
  console.info(`${title}: %i% (%i of %i)`, (count / total) * 100, count, total);
}

/** Parse countable value to numeric count */
function parseCount(value: TCountable): number {
  if (value instanceof Set) {
    value = value.size;
  } else if (Array.isArray(value)) {
    value = value.length;
  } else if (typeof value === "object") {
    value = Object.keys(value).length;
  }

  return value;
}

/** @internal */
async function _listDirFiles(
  dir: string,
  recursive: boolean = true
): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      recursive &&
        files.push(
          ...(await _listDirFiles(path.join(dir, item.name), recursive))
        );
    } else if (![".DS_Store"].includes(item.name)) {
      files.push(path.join(dir, item.name));
    }
  }

  return files;
}

/**
 * Recursively list all files within a directory.
 */
export async function listDirFiles(
  dir: string,
  recursive: boolean = true,
  relative: boolean = false
): Promise<string[]> {
  const absoluteFiles = await _listDirFiles(dir, recursive);
  if (relative) {
    return absoluteFiles.map((file) => path.relative(dir, file));
  }
  return absoluteFiles;
}
