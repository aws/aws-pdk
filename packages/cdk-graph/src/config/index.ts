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
import findUp = require("find-up"); // eslint-disable-line @typescript-eslint/no-require-imports

/** CdkGraph config file name */
export const CDK_GRAPH_RC = ".cdkgraphrc.js";

/** Variable replacement token for cdk.out directory */
export const CDK_OUTDIR_VAR = "<cdk.out>";

/** Default graph artifact output directory */
export const DEFAULT_OUTDIR = `${CDK_OUTDIR_VAR}/cdkgraph`;

/** CdkGraph configuration definition */
export interface CdkGraphConfig {
  /**
   * Directory where artifacts are written.
   *
   * The key `<cdk.out>` will be replaced with the synthesizer cdk `outdir`.
   *
   * Relative paths not prefixed with `<cdk.out>` will be relative to `process.cwd`
   *
   * @default "<cdk.out>/cdkgraph"
   */
  readonly outdir?: string;
  /** Additional configs */
  readonly [key: string]: any;
}

/** Default CdkGraph configuration */
const DEFAULT_CONFIG: CdkGraphConfig = {
  outdir: DEFAULT_OUTDIR,
};

/**
 * Resolve CdkGraph runtime configuration. Will detect local file system config if available and
 * merge with default configuration.
 * @internal
 */
export function resolveConfig(cwd?: string): CdkGraphConfig {
  const config = findUp.sync(CDK_GRAPH_RC, { cwd });
  if (config) {
    return {
      ...DEFAULT_CONFIG,
      ...require(config), // eslint-disable-line @typescript-eslint/no-require-imports
    };
  }

  return { ...DEFAULT_CONFIG };
}

/**
 * Resolve CdkGraph output directory. Performs replacement of tokens in config path.
 * @internal
 */
export function resolveOutdir(
  cdkOutdir: string,
  outdir: string = DEFAULT_OUTDIR
): string {
  return outdir.replace(CDK_OUTDIR_VAR, cdkOutdir);
}
