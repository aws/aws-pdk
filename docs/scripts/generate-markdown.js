// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs-extra");

const generateExperimentalBanner = (pkg) => `
:octicons-beaker-24: Experimental\n
!!! warning\n
\tThis module is subject to non-backward compatible changes or removal in any future version. Breaking changes
\twill be announced in the release notes, however will result in a minor version bump only.
\n\tWhilst you may use this package, you may need to update your
\tsource code when upgrading to a newer version.`;

const cwd = process.cwd();
const MONOREPO_ROOT = `${cwd}/..`;
const RELATIVE_PKG_ROOT = `${MONOREPO_ROOT}/packages`;
const pkgs = fs
  .readdirSync(RELATIVE_PKG_ROOT)
  .filter((p) => p !== "aws-pdk")
  .filter((p) => fs.existsSync(`${RELATIVE_PKG_ROOT}/${p}/.jsii`));

const PAGES_YAML_TEMPLATE = "---\nnav:\n";
const TYPESCRIPT = "typescript";
const PYTHON = "python";
const JAVA = "java";
const SUPPORTED_LANGUAGES = [TYPESCRIPT, PYTHON, JAVA];

function generateNavEntry(name, path) {
  return `  - '${name}': ${path}`;
}

function includeBanner(pkg, markdown, stability) {
  return stability !== "stable"
    ? `${generateExperimentalBanner(pkg)}\n${markdown}`
    : markdown;
}

function isPkgLanguageTarget(language, jsii) {
  let target = language;
  if (language === TYPESCRIPT) {
    target = "js";
  }

  if (jsii.targets) {
    jsii = jsii.targets;
  }

  return target in jsii;
}

function getArtifact(language, jsiiManifest) {
  switch (language) {
    case TYPESCRIPT:
      return jsiiManifest.targets.js.npm;
    case PYTHON:
      return jsiiManifest.targets.python.module;
    case JAVA:
      return `${jsiiManifest.targets.java.maven.groupId}/${jsiiManifest.targets.java.maven.artifactId}`;
    default:
      throw new Error(`Unknown language ${language}`);
  }
}

const cleanBuildDirectory = () => {
  fs.existsSync(`${cwd}/build`) &&
    fs.rmdirSync(`${cwd}/build`, { recursive: true });
  fs.mkdirSync(`${cwd}/build/docs`, { recursive: true });
};

const copyStaticAssets = () => {
  fs.copySync("content", `${cwd}/build/docs/content`);
  fs.copySync("mkdocs.yml", `${cwd}/build/docs/mkdocs.yml`);
  fs.copySync(
    `${MONOREPO_ROOT}/CONTRIBUTING.md`,
    `${cwd}/build/docs/content/welcome/contributing.md`
  );
};

const generateAPINav = () => {
  fs.writeFileSync(
    `${cwd}/build/docs/content/api/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${[generateNavEntry("API Reference", "index.md")]
      .concat(
        SUPPORTED_LANGUAGES.map((language) =>
          generateNavEntry(language, language)
        )
      )
      .join("\n")}`
  );
};

const generateAPIDocs = (pkg) => {
  const pkgJsii = JSON.parse(
    fs.readFileSync(`${RELATIVE_PKG_ROOT}/${pkg}/.jsii`).toString()
  );
  // Generate API Docs
  for (const language of SUPPORTED_LANGUAGES) {
    fs.mkdirSync(`${cwd}/build/docs/content/api/${language}`, {
      recursive: true,
    });

    // Ignore unsupported target languages in packages
    if (!isPkgLanguageTarget(language, pkgJsii)) {
      continue;
    }

    fs.mkdirSync(`${cwd}/build/docs/content/api/${language}/${pkg}`, {
      recursive: true,
    });

    const filePath = `${RELATIVE_PKG_ROOT}/${pkg}/docs/api/${language}/index.md`;
    if (fs.existsSync(filePath)) {
      const markdown = fs.readFileSync(filePath).toString();

      fs.writeFileSync(
        `${cwd}/build/docs/content/api/${language}/${pkg}/index.md`,
        includeBanner(
          getArtifact(language, pkgJsii),
          markdown,
          pkgJsii.docs.stability
        )
      );
    }

    // Write API nav
    fs.writeFileSync(
      `${cwd}/build/docs/content/api/${language}/.pages.yml`,
      `${PAGES_YAML_TEMPLATE}${pkgs
        .map((pkg) => {
          const jsiiTargets = JSON.parse(
            fs.readFileSync(`${RELATIVE_PKG_ROOT}/${pkg}/.jsii`).toString()
          ).targets;

          // Ignore unsupported target languages in packages
          if (!isPkgLanguageTarget(language, jsiiTargets)) {
            return;
          }

          return generateNavEntry(pkg, pkg);
        })
        .filter((v) => v != null)
        .join("\n")}`
    );
  }
};

const generateDeveloperGuidesNav = () => {
  fs.writeFileSync(
    `${cwd}/build/docs/content/developer_guides/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${[generateNavEntry("Developer Guides", "index.md")]
      .concat(
        pkgs
          .filter((p) =>
            fs.existsSync(
              `${RELATIVE_PKG_ROOT}/${p}/docs/developer_guides/${p}`
            )
          )
          .map((pkg) => generateNavEntry(pkg, pkg))
      )
      .join("\n")}`
  );
};

const generateFAQsNav = () => {
  fs.writeFileSync(
    `${cwd}/build/docs/content/faqs/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${[generateNavEntry("FAQ", "index.md")]
      .concat(
        pkgs
          .filter((p) =>
            fs.existsSync(`${RELATIVE_PKG_ROOT}/${p}/docs/faqs/${p}`)
          )
          .map((pkg) => generateNavEntry(pkg, pkg))
      )
      .join("\n")}`
  );
};

const generateWalkthroughsNav = () => {
  fs.writeFileSync(
    `${cwd}/build/docs/content/walkthroughs/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${[generateNavEntry("Walkthroughs", "index.md")]
      .concat(
        pkgs
          .filter((p) =>
            fs.existsSync(`${RELATIVE_PKG_ROOT}/${p}/docs/walkthroughs/${p}`)
          )
          .map((pkg) => generateNavEntry(pkg, pkg))
      )
      .join("\n")}`
  );
};

const copyStaticFolder = (pkg, folder) => {
  fs.existsSync(`${RELATIVE_PKG_ROOT}/${pkg}/docs/${folder}/${pkg}`) &&
    fs.copySync(
      `${RELATIVE_PKG_ROOT}/${pkg}/docs/${folder}/${pkg}`,
      `${cwd}/build/docs/content/${folder}/${pkg}`
    );
};

const copyPackageStaticDocs = (pkg) => {
  copyStaticFolder(pkg, "developer_guides");
  copyStaticFolder(pkg, "walkthroughs");
  copyStaticFolder(pkg, "faqs");
  copyStaticFolder(pkg, "assets");
};

async function main() {
  cleanBuildDirectory();
  copyStaticAssets();

  generateAPINav();
  generateDeveloperGuidesNav();
  generateWalkthroughsNav();
  generateFAQsNav();

  for (const pkg of pkgs) {
    generateAPIDocs(pkg);
    copyPackageStaticDocs(pkg);
  }
}

exports.main = main;

(async () => await main())().catch((e) => {
  console.error(e);
  process.exit(1);
});
