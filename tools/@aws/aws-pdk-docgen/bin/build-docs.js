// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const backOff = require('exponential-backoff');
const fs = require('fs-extra');
const docgen = require('jsii-docgen');

const PAGES_YAML_TEMPLATE = '---\nnav:\n';
const SUPPORTED_LANGUAGES = [
  docgen.Language.TYPESCRIPT,
  docgen.Language.PYTHON,
  docgen.Language.JAVA,
];

async function main() {
  const cwd = process.cwd();
  
  fs.rmdirSync(`${cwd}/build`, { recursive: true });
  fs.mkdirSync(`${cwd}/build/docs`, { recursive: true });

  fs.copySync("content", `${cwd}/build/docs/content`);
  fs.copySync("mkdocs.yml", `${cwd}/build/docs/mkdocs.yml`);

  fs.writeFileSync(`${cwd}/build/docs/content/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${SUPPORTED_LANGUAGES
      .map((language) => `  - ${language.name}`)
      .join('\n')}`);

  const mappings = fs.readdirSync(`${cwd}/../packages/@aws`)
  .filter(p => fs.existsSync(`${cwd}/../packages/@aws/${p}/.jsii`))
  .reduce((prev, curr) => {
    const jsiiTargets = JSON.parse(fs.readFileSync(`${cwd}/../packages/@aws/${curr}/.jsii`).toString()).targets;

    return {
      ...prev,
      [curr]: {
        [docgen.Language.TYPESCRIPT.name]: jsiiTargets.js.npm,
        [docgen.Language.PYTHON.name]: jsiiTargets.python.distName,
        [docgen.Language.JAVA.name]: jsiiTargets.java.maven.artifactId
      }
    }
  }, {});    


  SUPPORTED_LANGUAGES.map((l) => l.name).forEach((language) => {
    fs.mkdirSync(`${cwd}/build/docs/content/${language}`, { recursive: true });
    fs.writeFileSync(
      `${cwd}/build/docs/content/${language}/.pages.yml`,
      `${PAGES_YAML_TEMPLATE}${Object.entries(mappings)
        .map(([pkg, mapping]) => `  - '${mapping[language]}': ${pkg}`)
        .join('\n')}`,
    );

    Object.entries(mappings).forEach(async ([pkg, mapping]) => {
      fs.mkdirSync(`${cwd}/build/docs/content/${language}/${pkg}`, {
        recursive: true,
      });

      const docs = await docgen.Documentation.forProject(`${cwd}/../packages/@aws/${pkg}`);
      const markdown = await backOff.backOff(async () =>
        docs.toMarkdown({
          language: docgen.Language.fromString(language),
          allSubmodules: true,
          readme: true,
        }),
      );
      fs.writeFileSync(
        `${cwd}/build/docs/content/${language}/${pkg}/index.md`,
        markdown.render(),
      );

    });
  });
}

exports.main = main;

(async () => main())().catch((e) => {
  console.error(e);
  process.exit(1);
});