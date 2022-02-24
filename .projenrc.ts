// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { JsiiProject } from 'projen/lib/cdk';

const project = new JsiiProject({
  author: "AWS APJ COPE",
  authorAddress: "apj-cope@amazon.com",
  defaultReleaseBranch: "mainline",
  name: "aws-pdk",
  docgen: false,
  projenrcTs: true,
  keywords: ["aws", "pdk", "jsii", "projen"],
  prettier: true,
  repositoryUrl: "https://github.com/aws/aws-pdk",
  publishToMaven: {
    mavenGroupId: "software.amazon.awspdk",
    mavenArtifactId: "aws-pdk",
    javaPackage: "software.amazon.awspdk",
  },
  publishToPypi: {
    distName: "awspdk",
    module: "awspdk",
  },
  publishToNuget: {
    dotNetNamespace: "Amazon.PDK",
    packageId: "Amazon.PDK",
  },
  devDeps: [
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "aws-cdk-lib",
    "constructs",
    "cz-conventional-changelog",
    "eslint-plugin-header",
    "exponential-backoff",
    "husky",
    "jsii-docgen",
    "jsii-pacmak",
    "license-checker",
    "oss-attribution-generator",
  ],
  peerDeps: [
    "projen"
  ]
});

// Custom targets
project.addTask("prepare", {
  exec: "husky install"
});

project.addTask("clean", {
  exec: "rm -rf dist build lib test-reports coverage LICENSE-THIRD-PARTY"
});

const generateAttributionTask = project.addTask("generate:attribution", {
  exec: "generate-attribution && mv oss-attribution/attribution.txt LICENSE-THIRD-PARTY && rm -rf oss-attribution",
});
const gitSecretsScanTask = project.addTask("git-secrets-scan", {
  exec: "./scripts/git-secrets-scan.sh",
});
const licenseCheckerTask = project.addTask("license:check", {
  exec: "license-checker --summary --production --onlyAllow 'MIT;Apache-2.0;Unlicense;BSD;BSD-2-Clause;BSD-3-Clause;ISC;'",
});

project.addFields({
  resolutions: {
    "ansi-regex": "^5.0.1",
    "underscore": "^1.12.1",
    "deep-extend": "^0.5.1",
    "debug": "^2.6.9"
  }
});

// Commit lint and commitizen settings
project.addFields({
  config: {
    commitizen: {
      path: "./node_modules/cz-conventional-changelog",
    },
  },
  commitlint: {
    extends: ["@commitlint/config-conventional"],
  },
});

// eslint extensions
project.eslint?.addPlugins("header");
project.eslint?.addRules({
  "header/header": [
    2,
    "line",
    [
      " Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.",
      " SPDX-License-Identifier: Apache-2.0",
    ],
    2,
  ],
});

// Update .gitignore
project.gitignore.exclude("/.tools/", "/.idea/", "LICENSE-THIRD-PARTY", ".DS_Store", "build");

// Update npmignore
project.addPackageIgnore("/build/");
project.addPackageIgnore("/docs/");
project.addPackageIgnore("/scripts/");

// Generate docs for each supported language into a micro-site
project.addTask("build:docs", {
  exec: "./scripts/build-docs.sh"
});

// Add additional tests
project.testTask.spawn(gitSecretsScanTask);
project.testTask.spawn(licenseCheckerTask);

// Add attribution when packaging
project.packageTask.prependSpawn(generateAttributionTask);

project.synth();
