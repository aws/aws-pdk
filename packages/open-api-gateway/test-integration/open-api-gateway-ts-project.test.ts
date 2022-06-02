import { execSync } from "child_process";
import {executeInTempFolderSync} from "./utils/fs-utils";
import * as fs from "fs";
import {publishToLocalRegistry} from "./utils/publish-to-local-registry";
import {startLocalRegistry} from "./utils/start-local-registry";
import * as path from "path";


describe('OpenAPI Gateway Ts Project Integration Tests', () => {

  beforeAll(async () => {
    // TODO: Consider moving all the verdaccio setup etc into common package
    // @ts-ignore
    globalThis.__REGISTRY_PROCESS__ = await startLocalRegistry();
    publishToLocalRegistry('open-api-gateway');

    // HACK: Projen is using NODE_ENV internally with tests so we need to modify this :(
    // https://github.com/projen/projen/blob/e5899dd04a575209424a08fe90bde99e07ac6c7b/src/common.ts#L5
    process.env.NODE_ENV = '_test';

    execSync('npm install -g aws-cdk', {
      env: process.env,
      stdio: 'inherit',
    });
  });

  afterAll(async () => {
    fs.rmSync('./.npmrc');
    // @ts-ignore
    globalThis.__REGISTRY_PROCESS__ && globalThis.__REGISTRY_PROCESS__.kill();
  });

  it('Within Monorepo', () => {
    executeInTempFolderSync('open-api-gateway-monorepo', (tempFolder) => {
      // Create a monorepo project
      execSync('npx --yes projen new --from aws-prototyping-sdk nx-monorepo --no-git --name open-api-gateway-monorepo-ts-test', {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });

      // Add a dependency on the open-api-gateway package
      execSync('yarn add --dev -W @aws-prototyping-sdk/open-api-gateway', {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });

      // Write a projenrc.ts which adds an OpenApiGatewayTsProject to the monorepo
      fs.writeFileSync(path.join(tempFolder, ".projenrc.ts"), `import { nx_monorepo } from "aws-prototyping-sdk";
import { OpenApiGatewayTsProject, ClientLanguage } from '@aws-prototyping-sdk/open-api-gateway';

const cdkVersion = "2.27.0";
const constructsVersion = "10.1.28";

const project = new nx_monorepo.NxMonorepoProject({
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
`);

      // Run projen to generate the new files
      execSync('npx projen', {
        cwd: tempFolder,
        env: process.env,
        stdio: "inherit",
      });

      // Verify it builds successfully
      execSync('npx nx run-many --target=build --all', {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });
    });
  });

  it('Standalone', () => {
    executeInTempFolderSync('open-api-gateway', (tempFolder) => {
      execSync('npx --yes projen new --from @aws-prototyping-sdk/open-api-gateway open-api-gateway-ts --no-git --name open-api-gateway-ts-test', {
        cwd: tempFolder,
        env: process.env, // This is important to make sure we use the local registry!
        stdio: 'inherit',
      });

      // Install and build the generated typescript client
      execSync('yarn && npx projen build', {
        cwd: path.join(tempFolder, "generated", "typescript"),
        env: process.env,
        stdio: "inherit",
      });

      // Build the parent
      execSync('npx projen build', {
        cwd: tempFolder,
        env: process.env,
        stdio: 'inherit',
      });
    });
  });

});
