import { pdk_projen } from 'aws-prototyping-sdk';

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
  parent: monorepo,
  outdir: 'packages/infra',
  appEntrypoint: 'infra/pipeline.py',
  deps: ['aws-prototyping-sdk'],
  context: {},
});

monorepo.synth();
