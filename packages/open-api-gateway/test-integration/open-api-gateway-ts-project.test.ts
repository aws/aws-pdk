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

import { execSync, ExecSyncOptions } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { executeInTempFolderSync } from "./utils/fs-utils";
import { publishToLocalRegistry } from "./utils/publish-to-local-registry";
import { startLocalRegistry } from "./utils/start-local-registry";

describe("OpenAPI Gateway Ts Project Integration Tests", () => {
  beforeAll(async () => {
    // TODO: Consider moving all the verdaccio setup etc into common package
    // @ts-ignore
    globalThis.__REGISTRY_PROCESS__ = await startLocalRegistry();
    publishToLocalRegistry("open-api-gateway");

    // HACK: Projen is using NODE_ENV internally with tests so we need to modify this :(
    // https://github.com/projen/projen/blob/e5899dd04a575209424a08fe90bde99e07ac6c7b/src/common.ts#L5
    process.env.NODE_ENV = "_test";
  });

  afterAll(async () => {
    fs.rmSync("./.npmrc", { force: true });
    // @ts-ignore
    globalThis.__REGISTRY_PROCESS__ && globalThis.__REGISTRY_PROCESS__.kill();
  });

  // Create an exec method with default options
  const executor =
    (tempFolder: string) => (cmd: string, options?: ExecSyncOptions) =>
      execSync(cmd, {
        cwd: tempFolder,
        env: {
          ...process.env, // This is important to make sure we use the local registry!
          npm_config_yes: "true", // Disable any prompts for new packages
        },
        stdio: "inherit",
        ...options,
      });

  it("Within Monorepo", () => {
    executeInTempFolderSync("open-api-gateway-monorepo", (tempFolder) => {
      const exec = executor(tempFolder);

      // Create a monorepo project
      exec(
        "npx projen new --from aws-prototyping-sdk nx-monorepo --no-git --name open-api-gateway-monorepo-ts-test"
      );

      // Add a dependency on the open-api-gateway package
      exec("yarn add --dev -W @aws-prototyping-sdk/open-api-gateway");

      // Write a projenrc.ts which adds an OpenApiGatewayTsProject to the monorepo
      fs.writeFileSync(
        path.join(tempFolder, ".projenrc.ts"),
        `import { NxMonorepoProject } from "aws-prototyping-sdk/nx_monorepo";
import { OpenApiGatewayTsProject, ClientLanguage } from '@aws-prototyping-sdk/open-api-gateway';

const cdkVersion = "2.27.0";
const constructsVersion = "10.1.28";

const project = new NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: [
    "aws-prototyping-sdk",
    "@aws-prototyping-sdk/open-api-gateway",
  ],
  name: "open-api-gateway-monorepo-ts-test",
  deps: [],
});

project.package.addField('resolutions', {
  "**/aws-cdk-lib": cdkVersion,
  "**/constructs": constructsVersion,
});

new OpenApiGatewayTsProject({
  defaultReleaseBranch: "mainline",
  name: 'open-api-test-api',
  parent: project,
  outdir: 'packages/api',
  clientLanguages: [ClientLanguage.TYPESCRIPT],
});

project.synth();
`
      );

      // Run projen to generate the new files
      exec("npx projen");

      // Verify it builds successfully
      exec("npx nx run-many --target=build --all");
    });
  });

  it("Standalone", () => {
    executeInTempFolderSync("open-api-gateway", (tempFolder) => {
      const exec = executor(tempFolder);

      exec(
        "npx projen new --from @aws-prototyping-sdk/open-api-gateway open-api-gateway-ts --no-git --name open-api-gateway-ts-test"
      );

      // Install and build the generated typescript client
      exec("yarn && npx projen build", {
        cwd: path.join(tempFolder, "generated", "typescript"),
      });

      // Build the parent
      exec("npx projen build");
    });
  });
});
