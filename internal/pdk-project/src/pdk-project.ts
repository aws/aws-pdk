// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SampleDir } from 'projen';
import { JsiiJavaTarget, JsiiProject, JsiiProjectOptions, JsiiPythonTarget } from 'projen/lib/cdk';
import { Release } from 'projen/lib/release';

export enum Maturity {
  STABLE = 'stable',
  EXPERIMENTAL = 'experimental'
}

export interface PDKProjectOptions extends JsiiProjectOptions {
  /**
   * @default "experimental"
   */
  readonly maturity?: Maturity;

  readonly publishToPypiConfig?: JsiiPythonTarget;

  readonly publishToMavenConfig?: JsiiJavaTarget;
}

export class PDKProject extends JsiiProject {
  constructor(options: PDKProjectOptions) {
    const nameWithUnderscore = options.name.replace(/-/g, '_');
    const condensedName = options.name.replace(/-/g, '');
    const name = options.name === 'aws-prototyping-sdk' ? options.name : `@aws-prototyping-sdk/${options.name}`;

    super({
      ...options,
      github: false,
      sampleCode: false,
      docgen: false,
      prettier: options.prettier || true,
      projenDevDependency: false,
      srcdir: 'src',
      testdir: 'test',
      stability: options.maturity || Maturity.EXPERIMENTAL,
      readme: {
        contents: 'TODO',
      },
      name,
      packageName: name,
      outdir: `packages/${options.name}`,
      publishToPypi: options.publishToPypiConfig || {
        distName: `aws_prototyping_sdk.${nameWithUnderscore}`,
        module: `aws_prototyping_sdk.${nameWithUnderscore}`,
      },
      publishToMaven: options.publishToMavenConfig || {
        mavenEndpoint: 'https://aws.oss.sonatype.org',
        mavenGroupId: 'software.aws.awsprototypingsdk',
        mavenArtifactId: `${options.name}`,
        javaPackage: `software.aws.awsprototypingsdk.${condensedName}`,
      },
      gitignore: [...options.gitignore || [], 'LICENSE_THIRD_PARTY'],
    });

    if (this.deps.all.find((dep) => 'aws-prototyping-sdk' === dep.name)) {
      throw new Error(
        'PDK Projects cannot have a dependency on the aws-prototyping-sdk!',
      );
    }

    if (!this.name.match(/^(@aws-prototyping-sdk\/[a-z-]+(?<!-)|aws-prototyping-sdk)$/)) {
      throw new Error(
        'name should be lowercase and include optional hyphens.',
      );
    }

    if (!this.parent) {
      throw new Error('parent must be provided!');
    }

    if (options.sampleCode === undefined || options.sampleCode === true) {
      new SampleDir(this, this.srcdir, {
        files: {
          'index.ts':
            'export * as construct from "./construct";\nexport * as project from "./project";',
          'construct/index.ts': 'export default "IMPLEMENT ME";',
          'project/index.ts': 'export default "IMPLEMENT ME";',
        },
      });

      new SampleDir(this, this.testdir, {
        files: {
          'construct/.gitkeep': '',
          'project/.gitkeep': '',
        },
      });
    }

    new PDKRelease(this);
  }
}

class PDKRelease extends Release {
  constructor(project: PDKProject) {
    super(project, {
      versionFile: 'package.json',
      task: project.buildTask,
      branch: 'mainline',
      artifactsDirectory: project.artifactsDirectory,
    });

    project.addDevDeps('license-checker', 'oss-attribution-generator');

    project.packageTask.reset();
    project.packageTask.exec("npx license-checker --summary --production --onlyAllow 'MIT;Apache-2.0;Unlicense;BSD;BSD-2-Clause;BSD-3-Clause;ISC;'");
    project.packageTask.exec('npx generate-attribution && mv oss-attribution/attribution.txt ./LICENSE_THIRD_PARTY && rm -rf oss-attribution');
    project.packageTask.spawn(project.tasks.tryFind('package-all')!);
    project.npmignore?.addPatterns('!LICENSE_THIRD_PARTY');

    project.addTask('publish:npm', {
      exec: 'npx -p publib@latest publib-npm',
    });

    project.addTask('publish:maven', {
      exec: 'npx -p publib@latest publib-maven',
    });

    project.addTask('publish:pypi', {
      exec: 'npx -p publib@latest publib-pypi',
    });

    const releaseTask = project.tasks.tryFind("release:mainline")!;
    releaseTask.reset();
    releaseTask.env("RELEASE", "true");
    releaseTask.exec("rm -rf dist");
    releaseTask.spawn(project.tasks.tryFind("bump")!);
    releaseTask.spawn(project.buildTask);
    releaseTask.spawn(project.tasks.tryFind("unbump")!);
  }
}
