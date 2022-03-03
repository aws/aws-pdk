// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { JsiiProject } from "projen/lib/cdk";
import { JobPermission } from "projen/lib/github/workflows-model";

const project = new JsiiProject({
  author: "AWS APJ COPE",
  authorAddress: "apj-cope@amazon.com",
  defaultReleaseBranch: "mainline",
  name: "aws-prototyping-sdk",
  docgen: false,
  projenrcTs: true,
  keywords: ["aws", "pdk", "jsii", "projen"],
  prettier: true,
  repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
  devDeps: [
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "@nrwl/devkit",
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
  peerDeps: ["projen", "constructs", "aws-cdk-lib"],
  deps: ["constructs", "aws-cdk-lib"],
  publishToPypi: {
    distName: "aws_prototyping_sdk",
    module: "aws_prototyping_sdk",
  },
  publishToMaven: {
    mavenEndpoint: "https://aws.oss.sonatype.org",
    mavenGroupId: "software.aws.awsprototypingsdk",
    mavenArtifactId: "aws-prototyping-sdk",
    javaPackage: "software.aws.awsprototypingsdk",
    mavenRepositoryUrl: "https://aws.oss.sonatype.org/content/repositories/releases",
    mavenServerId: "sonatype-nexus-staging"
  }
});

project.release?.addJobs({
  release_docs: {
    runsOn: ["ubuntu-latest"],
    needs: ["release_github"],
    permissions: {
      contents: JobPermission.WRITE,
    },
    if: "needs.release.outputs.latest_commit == github.sha",
    steps: [
      {
        name: "Check out",
        uses: "actions/checkout@v2.4.0",
        with: {
          ref: "gh-pages",
          "fetch-depth": 0,
        },
      },
      {
        name: "Download build artifacts",
        uses: "actions/download-artifact@v2",
        with: {
          name: "build-artifact",
          path: "dist",
        },
      },
      {
        name: "Configure Git",
        run: [
          `git config user.name "AWS PDK Automation"`,
          `git config user.email "aws-pdk+automation@amazon.com"`,
        ].join("\n"),
      },
      {
        name: "Upload docs to Github",
        run: "zip -r docs.zip dist/docs/* && gh release upload $(cat dist/releasetag.txt) -R $GITHUB_REPOSITORY docs.zip && rm docs.zip",
        env: {
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
          GITHUB_REPOSITORY: "${{ github.repository }}",
        },
      },
      {
        name: "Prepare Commit",
        run: [
          "mv dist ${{ runner.temp }}/dist",
          "rsync --delete --exclude=.git --recursive ${{ runner.temp }}/dist/docs/ .",
          "touch .nojekyll",
          "git add .",
          "git diff --cached --exit-code >/dev/null || (git commit -am 'docs: publish from ${{ github.sha }}')",
        ].join("\n"),
      },
      {
        name: "Push",
        run: "git push origin gh-pages:gh-pages",
      },
    ],
  },
});

// Custom targets
project.addTask("prepare", {
  exec: "husky install",
});

project.addTask("clean", {
  exec: "rm -rf dist build lib test-reports coverage LICENSE-THIRD-PARTY",
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
    underscore: "^1.12.1",
    "deep-extend": "^0.5.1",
    debug: "^2.6.9",
  },
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
project.eslint?.addRules({
  "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
});

// Update .gitignore
project.gitignore.exclude(
  "/.tools/",
  "/.idea/",
  "LICENSE-THIRD-PARTY",
  ".DS_Store",
  "build"
);

// Update npmignore
[
  "/.gitattributes",
  "/.prettierignore",
  "/.prettierrc.json",
  "/.projenrc.ts",
  "/.husky/",
  "/.tools/",
  "/build/",
  "/docs/",
  "/scripts/",
].forEach((s) => project.addPackageIgnore(s));

// Generate docs for each supported language into a micro-site
const buildDocsTask = project.addTask("build:docs", {
  exec: "./scripts/build-docs.sh",
});

project.tasks.tryFind("release:mainline")?.spawn(buildDocsTask);

// Add additional tests
project.testTask.spawn(gitSecretsScanTask);
project.testTask.spawn(licenseCheckerTask);

// Add attribution when packaging
project.packageTask.prependSpawn(generateAttributionTask);

project.synth();
