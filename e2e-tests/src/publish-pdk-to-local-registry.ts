import { execSync } from 'child_process';
import * as fs from 'fs';

const PDK_PACKAGE_PATH_JS = '../packages/@aws/aws-pdk-lib/dist/js/aws-pdk-lib@0.0.0.jsii.tgz';
const PDK_PACKAGE_PATH_JAVA = '../dist/java/software/aws/awsprototypingsdk/aws-pdk-lib/0.0.0/aws-pdk-lib-0.0.0.jar';

/**
 * Registry configuration is specified via env params.
 */
process.env.npm_config_registry = 'http://localhost:4873';
process.env.YARN_REGISTRY = process.env.npm_config_registry;

/**
 * Publishes the PDK to a local Verdaccio registry.
 */
export const publishPDKToLocalRegistry = () => {
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

  execSync(`npm publish ${PDK_PACKAGE_PATH_JS} --no-workspaces`, {
    env: process.env, // Ensures this is targeting the local registry
    stdio: 'inherit',
  });

  execSync(`mvn install:install-file -Dfile=${PDK_PACKAGE_PATH_JAVA} -DgroupId=software.aws.awsprototypingsdk -DartifactId=aws-pdk-lib -Dversion=0.0.0 -Dpackaging=jar`, {
    env: process.env, // Ensures this is targeting the local registry
    stdio: 'inherit',
  });
};