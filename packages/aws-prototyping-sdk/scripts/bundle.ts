#!/usr/bin/env ts-node

import * as console from 'console';
import * as path from 'path';
import * as process from 'process';
import * as fs from 'fs-extra';
import { Stability } from 'projen/lib/cdk';


// The directory where our 'package.json' lives
const MONOPACKAGE_ROOT = process.cwd();

const ROOT_PATH = findWorkspacePath();
const UBER_PACKAGE_JSON_PATH = path.join(MONOPACKAGE_ROOT, 'package.json');

const EXCLUDED_PACKAGES: string[] = [];

async function main() {
  console.log(`🌴  workspace root path is: ${ROOT_PATH}`);
  const uberPackageJson = await fs.readJson(UBER_PACKAGE_JSON_PATH) as PackageJson;
  const libraries = await findLibrariesToPackage(uberPackageJson);
  await verifyDependencies(uberPackageJson, libraries);
  await prepareSourceFiles(libraries, uberPackageJson);

  // if explicitExports is set to `false`, remove the "exports" section from package.json
  const explicitExports = uberPackageJson.bundle?.explicitExports ?? true;
  if (!explicitExports) {
    delete uberPackageJson.exports;
  }

  // Rewrite package.json (exports will have changed)
  await fs.writeJson(UBER_PACKAGE_JSON_PATH, uberPackageJson, { spaces: 2 });
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error('❌ An error occurred: ', err.stack);
    process.exit(1);
  },
);

interface LibraryReference {
  readonly packageJson: PackageJson;
  readonly root: string;
  readonly shortName: string;
}

interface PackageJson {
  readonly main?: string;
  readonly description?: string;
  readonly bundleDependencies?: readonly string[];
  readonly bundledDependencies?: readonly string[];
  readonly dependencies?: { readonly [name: string]: string };
  readonly devDependencies?: { readonly [name: string]: string };
  readonly jsii: {
    readonly targets?: {
      readonly dotnet?: {
        readonly namespace: string;
        readonly [key: string]: unknown;
      };
      readonly java?: {
        readonly package: string;
        readonly [key: string]: unknown;
      };
      readonly python?: {
        readonly module: string;
        readonly [key: string]: unknown;
      };
      readonly [language: string]: unknown;
    };
  };
  readonly name: string;
  readonly types: string;
  readonly version: string;
  readonly stability: string;
  readonly [key: string]: unknown;
  readonly bundle?: {
    readonly deprecatedPackages?: readonly string[];

    /**
     * Whether to exclude this package from the uber package
     *
     * @default false
     */
    readonly exclude?: boolean;

    /**
     * The directory where we're going to collect all the libraries.
     *
     * @default - root of the bundle package
     */
    readonly libRoot?: string;

    /**
     * Adds an `exports` section to the bundle package.json file to ensure that
     * consumers won't be able to accidentally import a private file.
     *
     * @default true
     */
    readonly explicitExports?: boolean;

    /**
     * An exports section that should be ignored for v1 but included for bundle
     */
    readonly exports?: Record<string, string>;
  };
  exports?: Record<string, string>;
}

/**
 * Find the workspace root path. Walk up the directory tree until you find nx.json
 */
function findWorkspacePath(): string {

  return _findRootPath(process.cwd());

  function _findRootPath(part: string): string {
    if (part === path.resolve(part, '..')) {
      throw new Error('couldn\'t find a \'nx.json\' file when walking up the directory tree, are you in a aws-pdk project?');
    }

    if (fs.existsSync(path.resolve(part, 'nx.json'))) {
      return part;
    }

    return _findRootPath(path.resolve(part, '..'));
  }
}

async function findLibrariesToPackage(uberPackageJson: PackageJson): Promise<readonly LibraryReference[]> {
  console.log('🔍 Discovering libraries that need packaging...');

  const deprecatedPackages = uberPackageJson.bundle?.deprecatedPackages;
  const result = new Array<LibraryReference>();
  const librariesRoot = path.resolve(ROOT_PATH, 'packages');

  for (const dir of await fs.readdir(librariesRoot)) {
    const packageJsonPath = path.resolve(librariesRoot, dir, 'package.json');
    if (!fs.pathExistsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = await fs.readJson(packageJsonPath) as PackageJson;

    if (packageJson.bundle?.exclude || EXCLUDED_PACKAGES.includes(packageJson.name)) {
      console.log(`\t⚠️ Skipping (bundle excluded):    ${packageJson.name}`);
      continue;
    } else if (packageJson.jsii == null ) {
      console.log(`\t⚠️ Skipping (not jsii-enabled):   ${packageJson.name}`);
      continue;
    } else if (deprecatedPackages?.some(packageName => packageName === packageJson.name)) {
      console.log(`\t⚠️ Skipping (bundle deprecated): ${packageJson.name}`);
      continue;
    } else if (packageJson.deprecated) {
      console.log(`\t⚠️ Skipping (deprecated):         ${packageJson.name}`);
      continue;
    } else if (packageJson.stability !== Stability.STABLE) {
      console.log(`\t⚠️ Skipping (non stable):         ${packageJson.name}`);
      continue;
    }
    result.push({
      packageJson,
      root: path.join(librariesRoot, dir),
      shortName: packageJson.name === 'aws-prototyping-sdk' ? packageJson.name : packageJson.name.slice('@aws-prototyping-sdk/'.length),
    });
  }

  console.log(`\tℹ️ Found ${result.length} relevant packages!`);

  return result;
}

async function verifyDependencies(packageJson: any, libraries: readonly LibraryReference[]): Promise<void> {
  console.log('🧐 Verifying dependencies are complete...');
  const toBundle: Record<string, string> = {};

  for (const library of libraries) {
    for (const depName of library.packageJson.bundleDependencies ?? library.packageJson.bundledDependencies ?? []) {
      const requiredVersion = library.packageJson.devDependencies?.[depName]
        ?? library.packageJson.dependencies?.[depName]
        ?? '*';
      if (toBundle[depName] != null && toBundle[depName] !== requiredVersion) {
        throw new Error(`Required to bundle different versions of ${depName}: ${toBundle[depName]} and ${requiredVersion}.`);
      }
      toBundle[depName] = requiredVersion;
    }

    if (!(library.packageJson.name in packageJson.devDependencies)) {
      throw new Error(`\t⚠️ Missing dev dependency: ${library.packageJson.name}`);
    }
  }

  const workspacePath = path.resolve(ROOT_PATH, 'package.json');
  const workspace = await fs.readJson(workspacePath);

  const spuriousBundledDeps = new Set<string>(packageJson.bundledDependencies ?? []);
  for (const [name, version] of Object.entries(toBundle)) {
    spuriousBundledDeps.delete(name);

    const nohoist = `${packageJson.name}/${name}`;
    if (!workspace.workspaces.nohoist?.includes(nohoist)) {
      throw new Error(`\t⚠️ Missing yarn workspace nohoist: ${nohoist}`);
    }

    if (!(packageJson.bundledDependencies?.includes(name))) {
      throw new Error(`\t⚠️ Missing bundled dependency: ${name} at ${version}`);
    }

    if (packageJson.dependencies?.[name] !== version) {
      throw new Error(`\t⚠️ Missing or incorrect dependency: ${name} at ${version}`);
    }
  }
  packageJson.bundledDependencies = packageJson.bundledDependencies?.filter((dep: string) => !spuriousBundledDeps.has(dep));
  if (spuriousBundledDeps.size > 0) {
    throw new Error(`\t⚠️ Spurious bundled dependencies detected. Please remove from dependencies: ${spuriousBundledDeps}`);
  }

  console.log('\t✅ Dependencies are correct!');
}

async function prepareSourceFiles(libraries: readonly LibraryReference[], packageJson: PackageJson) {
  console.log('📝 Preparing source files...');

  const libRoot = resolveLibRoot(packageJson);

  // Should not remove collection directory if we're currently in it. The OS would be unhappy.
  if (libRoot !== process.cwd()) {
    await fs.remove(libRoot);
  }

  // Control 'exports' field of the 'package.json'. This will control what kind of 'import' statements are
  // allowed for this package: we only want to allow the exact import statements that we want to support.
  packageJson.exports = {
    '.': './index.js',

    // We need to expose 'package.json' and '.jsii' because 'jsii' and 'jsii-reflect' load them using
    // require(). (-_-). Can be removed after https://github.com/aws/jsii/pull/3205 gets merged.
    './package.json': './package.json',
    './.jsii': './.jsii',

    // This is necessary to support jsii cross-module warnings
    './.warnings.jsii.js': './.warnings.jsii.js',
  };

  const indexStatements = new Array<string>();
  for (const library of libraries) {
    const libDir = path.join(libRoot, library.shortName);
    const copied = await transformPackage(library, packageJson, libDir, libraries);

    if (!copied) {
      continue;
    }

    indexStatements.push(`export * as ${library.shortName.replace(/-/g, '_')} from './${library.shortName}';`);
    copySubmoduleExports(packageJson.exports, library, library.shortName);
  }

  stitchSubmoduleReadmes(libRoot, libraries);

  await fs.writeFile(path.join(libRoot, 'index.ts'), indexStatements.join('\n'), { encoding: 'utf8' });

  console.log('\t🍺 Success!');
}

function stitchSubmoduleReadmes(libRoot: string, libraries: readonly LibraryReference[]) {
  let stitchedReadme = "";
  for (const library of  libraries) {
    stitchedReadme += `\n## ${library.shortName}\n`;
    stitchedReadme += fs.readFileSync(`${libRoot}/${library.shortName}/README.md`).toString();
  }

  fs.rmSync(`${libRoot}/README.md`, { force: true });
  fs.writeFileSync(`${libRoot}/README.md`, `${fs.readFileSync(`${libRoot}/.README.md`).toString()}${stitchedReadme}`, { mode: "444" });
}

/**
 * Copy the sublibrary's exports into the 'exports' of the main library.
 *
 * Replace the original 'main' export with an export of the new '<submodule>/index.ts` file we've written
 * in 'transformPackage'.
 */
function copySubmoduleExports(targetExports: Record<string, string>, library: LibraryReference, subdirectory: string) {
  const visibleName = library.shortName;

  // Do both REAL "exports" section, as well as virtual, bundle-only "exports" section
  for (const exportSet of [library.packageJson.exports, library.packageJson.bundle?.exports]) {
    for (const [relPath, relSource] of Object.entries(exportSet ?? {})) {
      targetExports[`./${unixPath(path.join(visibleName, relPath))}`] = `./${unixPath(path.join(subdirectory, relSource))}`;
    }
  }

  targetExports[`./${unixPath(visibleName)}`] = `./${unixPath(subdirectory)}/index.js`;
}

async function transformPackage(
  library: LibraryReference,
  uberPackageJson: PackageJson,
  destination: string,
  allLibraries: readonly LibraryReference[],
) {
  await fs.mkdirp(destination);
  await copyOrTransformFiles(library.root, destination, allLibraries, uberPackageJson);

  await fs.writeFile(
    path.join(destination, 'index.ts'),
    `export * from './${library.packageJson.types.replace(/(\/index)?(\.d)?\.ts$/, '')}';\n`,
    { encoding: 'utf8' },
  );

  const config = uberPackageJson.jsii.targets;
  await fs.writeJson(
    path.join(destination, '.jsiirc.json'),
    {
      targets: transformTargets(config, library.packageJson.jsii.targets),
    },
    { spaces: 2 },
  );

  // if libRoot is _not_ under the root of the package, generate a file at the
  // root that will refer to the one under lib/ so that users can still import
  // from "monocdk/aws-lambda".
  const relativeLibRoot = uberPackageJson.bundle?.libRoot;
  if (relativeLibRoot && relativeLibRoot !== '.') {
    await fs.writeFile(
      path.resolve(MONOPACKAGE_ROOT, `${library.shortName}.ts`),
      `export * from './${relativeLibRoot}/${library.shortName}';\n`,
      { encoding: 'utf8' },
    );
  }

  return true;
}

function transformTargets(monoConfig: PackageJson['jsii']['targets'], targets: PackageJson['jsii']['targets']): PackageJson['jsii']['targets'] {
  if (targets == null) { return targets; }

  const result: Record<string, any> = {};
  for (const [language, config] of Object.entries(targets)) {
    switch (language) {
      case 'dotnet':
        if (monoConfig?.dotnet != null) {
          result[language] = {
            namespace: (config as any).namespace,
          };
        }
        break;
      case 'java':
        if (monoConfig?.java != null) {
          result[language] = {
            package: (config as any).package,
          };
        }
        break;
      case 'python':
        if (monoConfig?.python != null) {
          result[language] = {
            module: `${monoConfig.python.module}.${(config as any).module.replace(/^aws_prototyping_sdk\./, '')}`,
          };
        }
        break;
      default:
        throw new Error(`Unsupported language for submodule configuration translation: ${language}`);
    }
  }

  return result;
}

async function copyOrTransformFiles(from: string, to: string, libraries: readonly LibraryReference[], uberPackageJson: PackageJson) {
  const promises = (await fs.readdir(from)).map(async name => {
    if (shouldIgnoreFile(name)) { return; }

    if (name.endsWith('.d.ts') || name.endsWith('.js')) {
      if (await fs.pathExists(path.join(from, name.replace(/\.(d\.ts|js)$/, '.ts')))) {
        // We won't copy .d.ts and .js files with a corresponding .ts file
        return;
      }
    }

    const source = path.join(from, name);
    const destination = path.join(to, name);

    const stat = await fs.stat(source);
    if (stat.isDirectory()) {
      await fs.mkdirp(destination);
      return copyOrTransformFiles(source, destination, libraries, uberPackageJson);
    }

    return fs.copyFile(source, destination);
  });

  await Promise.all(promises);
}

const IGNORED_FILE_NAMES = new Set([
  '.eslintrc.js',
  '.gitignore',
  '.jest.config.js',
  '.jsii',
  '.npmignore',
  'node_modules',
  'package.json',
  'tsconfig.json',
  'tsconfig.tsbuildinfo',
  'LICENSE',
  'NOTICE',
]);

function shouldIgnoreFile(name: string): boolean {
  return IGNORED_FILE_NAMES.has(name);
}

/**
 * Turn potential backslashes into forward slashes
 */
function unixPath(x: string) {
  return x.replace(/\\/g, '/');
}

/**
 * Resolves the directory where we're going to collect all the libraries.
 *
 * By default, this is purposely the same as the monopackage root so that our
 * two import styles resolve to the same files but it can be overridden by
 * seeting `bundle.libRoot` in the package.json of the uber package.
 *
 * @param uberPackageJson package.json contents of the uber package
 * @returns The directory where we should collect all the libraries.
 */
function resolveLibRoot(uberPackageJson: PackageJson): string {
  return path.resolve(uberPackageJson.bundle?.libRoot ?? MONOPACKAGE_ROOT);
}