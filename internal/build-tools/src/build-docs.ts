// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { backOff } from 'exponential-backoff';
import * as fs from 'fs-extra';
import { Documentation, Language } from 'jsii-docgen';

const PAGES_YAML_TEMPLATE = '---\nnav:\n';
const SUPPORTED_LANGUAGES = [
  Language.TYPESCRIPT,
  Language.PYTHON,
  Language.JAVA,
];

const cwd = process.cwd();
const RELATIVE_PKG_ROOT = `${cwd}/../../packages`;

async function main() {
  fs.rmdirSync(`${cwd}/build`, { recursive: true });
  fs.mkdirSync(`${cwd}/build/docs`, { recursive: true });

  fs.copySync('content', `${cwd}/build/docs/content`);
  fs.copySync('mkdocs.yml', `${cwd}/build/docs/mkdocs.yml`);

  fs.writeFileSync(`${cwd}/build/docs/content/.pages.yml`,
    `${PAGES_YAML_TEMPLATE}${SUPPORTED_LANGUAGES
      .map((language) => `  - ${language.name}`)
      .join('\n')}`);

  const mappings: {[pkg: string]: {[lang: string]: string}} = fs.readdirSync(RELATIVE_PKG_ROOT)
    .filter(p => fs.existsSync(`${RELATIVE_PKG_ROOT}/${p}/.jsii`))
    .reduce((prev, curr) => {
      const jsiiTargets = JSON.parse(fs.readFileSync(`${RELATIVE_PKG_ROOT}/${curr}/.jsii`).toString()).targets;

      return {
        ...prev,
        [curr]: {
          [Language.TYPESCRIPT.name]: jsiiTargets.js.npm,
          [Language.PYTHON.name]: jsiiTargets.python.distName,
          [Language.JAVA.name]: jsiiTargets.java.maven.artifactId,
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

      const docs = await Documentation.forProject(`${RELATIVE_PKG_ROOT}/${pkg}`);
      const markdown = await backOff(async () =>
        docs.toMarkdown({
          language: Language.fromString(language),
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