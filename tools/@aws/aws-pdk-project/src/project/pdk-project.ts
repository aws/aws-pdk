// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SampleDir } from 'projen';
import { JsiiProject, JsiiProjectOptions } from 'projen/lib/cdk';

export enum Maturity {
  STABLE = 'stable',
  EXPERIMENTAL = 'experimental'
}

export interface PDKProjectOptions extends JsiiProjectOptions {
  /**
   * @default "experimental"
   */
  readonly maturity?: Maturity;
}

export class PDKProject extends JsiiProject {
  constructor(options: PDKProjectOptions) {
    const nameWithUnderscore = options.name.replace(/-/g, '_');
    const condensedName = options.name.replace(/-/g, '');
    const name = `@aws/${options.name}`;

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
      outdir: `packages/@aws/${options.name}`,
      publishToPypi: {
        distName: `aws_prototyping_sdk.${nameWithUnderscore}`,
        module: `aws_prototyping_sdk.${nameWithUnderscore}`,
      },
      publishToMaven: {
        mavenEndpoint: 'https://aws.oss.sonatype.org',
        mavenGroupId: 'software.aws.awsprototypingsdk',
        mavenArtifactId: `${options.name}`,
        javaPackage: `software.aws.awsprototypingsdk.${condensedName}`,
      },
    });
    const upgradeTask = this.tasks.tryFind('upgrade');
    upgradeTask && this.addTask('upgrade-deps').spawn(upgradeTask);

    if (this.deps.all.find((dep) => '@aws/aws-pdk-lib' === dep.name)) {
      throw new Error(
        'PDK Projects cannot have a dependency on the aws-pdk-lib!',
      );
    }

    if (!this.name.match(/^@aws\/aws-pdk-[a-z-]+(?<!-)$/)) {
      throw new Error(
        'name should be lowercase, include optional hyphens and start with prefix: aws-pdk-',
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
