import { execSync } from 'child_process';
import * as fs from 'fs';

const PDK_PACKAGE_PATH = '../packages/aws-prototyping-sdk/dist/js/aws-prototyping-sdk@0.0.0.jsii.tgz';

/**
 * Registry configuration is specified via env params.
 */
process.env.npm_config_registry = 'http://localhost:4873';
process.env.YARN_REGISTRY = process.env.npm_config_registry;

/**
 * Publishes the PDK to a local Verdaccio registry.
 */
export const publishPDKToLocalRegistry = async () => {
  if (!process.env.npm_config_registry?.startsWith('http://localhost')) {
    throw Error('Local registry not configured.');
  }

  const npmMajorVersion = execSync('npm --version')
    .toString('utf-8')
    .trim()
    .split('.')[0];

  // NPM >= 7 requires an auth token. We can use a fake one given this is local.
  if (+npmMajorVersion >= 7) {
    await fs.writeFileSync(
      './.npmrc',
      `registry=${
        process.env.npm_config_registry
      }\n${process.env.npm_config_registry.replace(
        'http:',
        '',
      )}/:_authToken=fake`,
    );
  }

  execSync(`npm publish ${PDK_PACKAGE_PATH}`, {
    env: process.env, // Ensures this is targeting the local registry
    stdio: 'inherit',
  });
};