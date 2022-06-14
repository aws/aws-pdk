// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const backOff = require('exponential-backoff');
const fs = require('fs-extra');
const docgen = require('jsii-docgen');

const generateExperimentalBanner = (pkg) => `
:octicons-beaker-24: Experimental\n
!!! warning\n
\tThis is packaged in a separate module while the API is being stabilized.
\tThis package is subject to non-backward compatible changes or removal in any future version. Breaking changes 
\twill be announced in the release notes.
\n\tWhilst you may use this package, you may need to update your 
\tsource code when upgrading to a newer version. Once we stabilize the module, it will be included into the stable 
\taws-prototyping-sdk library.\n\n
!!! example "Experimental Usage"\n
\tTo use this package, add a dependency on: \`${pkg}\`
`;

const PAGES_YAML_TEMPLATE = '---\nnav:\n';
const SUPPORTED_LANGUAGES = [
  docgen.Language.TYPESCRIPT,
  docgen.Language.PYTHON,
  docgen.Language.JAVA,
];

function generateNavEntry(name, path) {
  return `  - '${name}': ${path}`;
}

function includeBanner(pkg, markdown, stability) {
  return stability !== 'stable' ? `${generateExperimentalBanner(pkg)}\n${markdown}`: markdown;
}

function getArtifact(language, jsiiManifest) {
  switch(language) {
    case docgen.Language.TYPESCRIPT.name:
      return jsiiManifest.targets.js.npm;
    case docgen.Language.PYTHON.name:
      return jsiiManifest.targets.python.module;
    case docgen.Language.JAVA.name:
      return `${jsiiManifest.targets.java.maven.groupId}/${jsiiManifest.targets.java.maven.artifactId}`;
    default:
      throw new Error(`Unknown language ${language}`);
  }
}

async function main() {
  const cwd = process.cwd();
  const RELATIVE_PKG_ROOT = `${cwd}/../../packages`;
  const bundleJsii = JSON.parse(fs.readFileSync(`${RELATIVE_PKG_ROOT}/aws-prototyping-sdk/.jsii`).toString());

  fs.existsSync(`${cwd}/build`) && fs.rmdirSync(`${cwd}/build`, { recursive: true });
  fs.mkdirSync(`${cwd}/build/docs`, { recursive: true });

  fs.copySync('content', `${cwd}/build/docs/content`);
  fs.copySync('mkdocs.yml', `${cwd}/build/docs/mkdocs.yml`);

  fs.writeFileSync(`${cwd}/build/docs/content/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${SUPPORTED_LANGUAGES
      .map((language) => `  - ${language.name}`)
      .join('\n')}`);

  SUPPORTED_LANGUAGES.map((l) => l.name).forEach((language) => {
    fs.mkdirSync(`${cwd}/build/docs/content/${language}`, { recursive: true });

    const pkgs = fs.readdirSync(RELATIVE_PKG_ROOT)
      .filter(p => "aws-prototyping-sdk" !== p)
      .filter(p => fs.existsSync(`${RELATIVE_PKG_ROOT}/${p}/.jsii`));

    pkgs.map(async (pkg) => {
        const pkgJsii = JSON.parse(fs.readFileSync(`${RELATIVE_PKG_ROOT}/${pkg}/.jsii`).toString());
        const stability = pkgJsii.docs.stability;

        fs.mkdirSync(`${cwd}/build/docs/content/${language}/${pkg}`, {
          recursive: true,
        });
  
        let markdown;
        if (stability === 'stable') {
          const docs = await docgen.Documentation.forProject(`${RELATIVE_PKG_ROOT}/aws-prototyping-sdk`);
          const submodule = Object.entries(bundleJsii.submodules)
            .find(([, v]) => v.symbolId.split('/')[1] === pkg)[0]
            .split('aws-prototyping-sdk.')[1];
          markdown = await backOff.backOff(async () =>
            docs.toMarkdown({
              language: docgen.Language.fromString(language),
              submodule,
              readme: true,
            }),
          );
        } else {
          const docs = await docgen.Documentation.forProject(`${RELATIVE_PKG_ROOT}/${pkg}`);
          markdown = await backOff.backOff(async () =>
            docs.toMarkdown({
              language: docgen.Language.fromString(language),
              allSubmodules: true,
              readme: true,
            }),
          );
        }
        
  
        fs.writeFileSync(
          `${cwd}/build/docs/content/${language}/${pkg}/index.md`,
          includeBanner(getArtifact(language, pkgJsii), markdown.render(), stability),
        );
      });

      fs.writeFileSync(
        `${cwd}/build/docs/content/${language}/.pages.yml`,
        `${PAGES_YAML_TEMPLATE}${pkgs
          .map(pkg => {
            const jsiiTargets = JSON.parse(fs.readFileSync(`${RELATIVE_PKG_ROOT}/${pkg}/.jsii`).toString()).targets;

            switch(language) {
              case docgen.Language.TYPESCRIPT.name:
                return generateNavEntry(pkg, pkg);
              case docgen.Language.PYTHON.name:
                return generateNavEntry(jsiiTargets.python.distName.split("aws_prototyping_sdk.")[1], pkg);
              case docgen.Language.JAVA.name:
                return generateNavEntry(jsiiTargets.java.maven.artifactId, pkg);
              default:
                throw new Error(`Unknown language ${language}`);
            }
          })
          .join('\n')}`,
      );

  });
}

exports.main = main;

(async () => main())().catch((e) => {
  console.error(e);
  process.exit(1);
});