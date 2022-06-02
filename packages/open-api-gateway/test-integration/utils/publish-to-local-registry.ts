import { execSync } from 'child_process';
import * as fs from 'fs';

/**
 * Registry configuration is specified via env params.
 */
process.env.npm_config_registry = 'http://localhost:4873';
process.env.YARN_REGISTRY = process.env.npm_config_registry;

/**
 * Publishes a pdk package to a local Verdaccio registry.
 */
export const publishToLocalRegistry = (...pdkPackageNames: string[]) => {
  if (!process.env.npm_config_registry?.startsWith('http://localhost')) {
    throw Error('Local registry not configured.');
  }

  const npmMajorVersion = execSync('npm --version --no-workspaces')
    .toString('utf-8')
    .trim()
    .split('.')[0];

  // NPM >= 7 requires an auth token. We can use a fake one given this is local.
  if (+npmMajorVersion >= 7) {
    fs.writeFileSync(
      './.npmrc',
      `registry=${
        process.env.npm_config_registry
      }\n${process.env.npm_config_registry.replace(
        'http:',
        '',
      )}/:_authToken=fake`,
    );
  }

  pdkPackageNames.forEach((pdkPackageName) => {
    const packagePath = `../../packages/${pdkPackageName}/dist/js/${pdkPackageName}@0.0.0.jsii.tgz`;
    execSync(`npm publish ${packagePath} --no-workspaces`, {
      env: process.env, // Ensures this is targeting the local registry
      stdio: 'inherit',
    });
  });
};
