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
  const currentDir = process.cwd();
  SUPPORTED_LANGUAGES.map((l) => l.name).forEach((language) => {
    fs.mkdirSync(`${currentDir}/dist/docs/content/${language}`, {
        recursive: true,
    });
    
    (async () => {
        const docs = await docgen.Documentation.forProject(currentDir);
        const markdown = await backOff.backOff(async () =>
        docs.toMarkdown({
            language: docgen.Language.fromString(language),
            allSubmodules: false,
            readme: true,
        }),
        );
        fs.writeFileSync(
        `${currentDir}/dist/docs/content/${language}/API.md`,
        markdown.render(),
        );
    })();
  });
}

exports.main = main;

(async () => main())().catch((e) => {
  console.error(e);
  process.exit(1);
});