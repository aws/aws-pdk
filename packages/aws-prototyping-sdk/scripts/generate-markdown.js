// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const backOff = require('exponential-backoff');
const fs = require('fs');
const docgen = require('jsii-docgen');

const PAGES_YAML_TEMPLATE = '---\nnav:\n';
const SUPPORTED_LANGUAGES = [
  docgen.Language.TYPESCRIPT,
  docgen.Language.PYTHON,
  docgen.Language.JAVA,
];

async function main() {
  const cwd = process.cwd();
  const jsii = JSON.parse(fs.readFileSync(`${cwd}/.jsii`, 'utf-8'));
  const submodules = Object.keys(jsii.submodules).map(
    (c) => c.split('.')[1],
  );
  const tasks = [];

  fs.writeFileSync(`build/docs/content/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${SUPPORTED_LANGUAGES
      .map((language) => `  - ${language.name}`)
      .join('\n')}`)

  SUPPORTED_LANGUAGES.map((l) => l.name).forEach((language) => {
    fs.mkdirSync(`build/docs/content/${language}`, { recursive: true });
    fs.writeFileSync(
      `build/docs/content/${language}/.pages.yml`,
      `${PAGES_YAML_TEMPLATE}${submodules
        .map((submodule) => `  - ${submodule}: ${submodule}`)
        .join('\n')}`,
    );

    submodules.forEach((submodule) => {
      fs.mkdirSync(`build/docs/content/${language}/${submodule}`, {
        recursive: true,
      });
      tasks.push(
        (async () => {
          const docs = await docgen.Documentation.forProject(cwd);
          const markdown = await backOff.backOff(async () =>
            docs.toMarkdown({
              language: docgen.Language.fromString(language),
              submodule,
              allSubmodules: false,
              readme: true,
            }),
          );
          fs.writeFileSync(
            `${cwd}/build/docs/content/${language}/${submodule}/API.md`,
            markdown.render(),
          );
        })(),
      );
    });
  });

  await Promise.all(tasks).catch((e) => console.log(e));
}

exports.main = main;

(async () => main())().catch((e) => {
  console.error(e);
  process.exit(1);
});
