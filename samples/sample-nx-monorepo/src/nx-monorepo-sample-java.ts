import { pdk_projen } from 'aws-prototyping-sdk';
import { ApprovalLevel } from 'projen/lib/awscdk';

const monorepo = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: 'mainline',
  devDeps: ['aws-prototyping-sdk'],
  name: 'monorepo',
});

new pdk_projen.PDKPipelineJavaProject({
  artifactId: 'infra',
  cdkVersion: '2.0.0',
  groupId: 'software.aws',
  mainClass: 'software.aws.Pipeline -Dexec.classpathScope=\"test\"',
  parent: monorepo,
  requireApproval: ApprovalLevel.NEVER,
  outdir: 'packages/infra',
  name: 'infra',
  version: '0.0.0',
  deps: ['software.aws.awsprototypingsdk/aws-prototyping-sdk@0.0.34'],
});

monorepo.synth();
