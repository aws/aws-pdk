// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const backOff = require('exponential-backoff');
const fs = require('fs-extra');
const docgen = require('jsii-docgen');

const EXPERIMENTAL_BANNER = `
!!! warning\n
\tThis is packaged in a separate module while the API is being stabilized.
\tThis package is subject to non-backward compatible changes or removal in any future version. Breaking changes 
\twill be announced in the release notes. Whilst you may use this package, you may need to update your 
\tsource code when upgrading to a newer version. Once we stabilize the module, it will be included into the stable 
\taws-prototyping-sdk library.
`;

const PAGES_YAML_TEMPLATE = '---\nnav:\n';
const SUPPORTED_LANGUAGES = [
  docgen.Language.TYPESCRIPT,
  docgen.Language.PYTHON,
  docgen.Language.JAVA,
];

function includeBanner(markdown, stability) {
  
  return stability !== 'stable' ? `${EXPERIMENTAL_BANNER}\n${markdown}`: markdown;
}

async function main() {
  const cwd = process.cwd();
  const RELATIVE_PKG_ROOT = `${cwd}/../packages`;

  fs.existsSync(`${cwd}/build`) && fs.rmdirSync(`${cwd}/build`, { recursive: true });
  fs.mkdirSync(`${cwd}/build/docs`, { recursive: true });

  fs.copySync('content', `${cwd}/build/docs/content`);
  fs.copySync('mkdocs.yml', `${cwd}/build/docs/mkdocs.yml`);

  fs.writeFileSync(`${cwd}/build/docs/content/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${SUPPORTED_LANGUAGES
      .map((language) => `  - ${language.name}`)
      .join('\n')}`);

  const mappings = fs.readdirSync(RELATIVE_PKG_ROOT)
    .filter(p => fs.existsSync(`${RELATIVE_PKG_ROOT}/${p}/.jsii`))
    .reduce((prev, curr) => {
      const jsiiTargets = JSON.parse(fs.readFileSync(`${RELATIVE_PKG_ROOT}/${curr}/.jsii`).toString()).targets;
      const stability = JSON.parse(fs.readFileSync(`${RELATIVE_PKG_ROOT}/${curr}/package.json`).toString()).stability;

      return {
        ...prev,
        [curr]: {
          stability,
          [docgen.Language.TYPESCRIPT.name]: jsiiTargets.js.npm,
          [docgen.Language.PYTHON.name]: jsiiTargets.python.distName,
          [docgen.Language.JAVA.name]: jsiiTargets.java.maven.artifactId,
        },
      };
    }, {});


  SUPPORTED_LANGUAGES.map((l) => l.name).forEach((language) => {
    fs.mkdirSync(`${cwd}/build/docs/content/${language}`, { recursive: true });
    fs.writeFileSync(
      `${cwd}/build/docs/content/${language}/.pages.yml`,
      `${PAGES_YAML_TEMPLATE}${Object.entries(mappings)
        .map(([pkg, mapping]) => `  - '${mapping[language]}': ${pkg}`)
        .join('\n')}`,
    );

    Object.keys(mappings).forEach(async (pkg) => {
      fs.mkdirSync(`${cwd}/build/docs/content/${language}/${pkg}`, {
        recursive: true,
      });

      const docs = await docgen.Documentation.forProject(`${RELATIVE_PKG_ROOT}/${pkg}`);
      const markdown = await backOff.backOff(async () =>
        docs.toMarkdown({
          language: docgen.Language.fromString(language),
          allSubmodules: true,
          readme: true,
        }),
      );

      fs.writeFileSync(
        `${cwd}/build/docs/content/${language}/${pkg}/index.md`,
        includeBanner(markdown.render(), mappings[pkg].stability),
      );

    });
  });
}

exports.main = main;

(async () => main())().catch((e) => {
  console.error(e);
  process.exit(1);
});