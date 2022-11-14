/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
