import { pdk_projen } from 'aws-prototyping-sdk';
import { ApprovalLevel } from 'projen/lib/awscdk';

const monorepo = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: 'mainline',
  devDeps: ['aws-prototyping-sdk'],
  name: 'monorepo',
});

new pdk_projen.PDKPipelinePyProject({
  authorEmail: '',
  authorName: '',
  cdkVersion: '2.0.0',
  moduleName: 'infra',
  name: 'infra',
  version: '0.0.0',
  requireApproval: ApprovalLevel.NEVER,
  parent: monorepo,
  outdir: 'packages/infra',
  appEntrypoint: 'infra/pipeline.py',
  deps: ['aws-prototyping-sdk', 'pyhumps'],
});

monorepo.synth();
