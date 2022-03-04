import { pdk_projen } from "aws-prototyping-sdk";

const monorepo = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: "mainline",
  devDeps: ["aws-prototyping-sdk"],
  name: "monorepo",
});

new pdk_projen.PDKPipelineTsProject({
  defaultReleaseBranch: "mainline",
  name: "infra",
  cdkVersion: "2.0.0",
  appEntrypoint: "pipeline.ts",
  parent: monorepo,
  outdir: "packages/infra",
  deps: ["aws-prototyping-sdk"],
});

monorepo.synth();
