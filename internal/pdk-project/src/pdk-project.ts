// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SampleDir } from 'projen';
import { JsiiJavaTarget, JsiiProject, JsiiProjectOptions, JsiiPythonTarget } from 'projen/lib/cdk';

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
      prettier: true,
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
    });
    const upgradeTask = this.tasks.tryFind('upgrade');
    upgradeTask && this.addTask('upgrade-deps').spawn(upgradeTask);

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
  }
}
