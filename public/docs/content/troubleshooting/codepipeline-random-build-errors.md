---
title: CodePipeline build failures
tags: codepipeline, codebuild
packages: pipeline
---

# I get random build failures in `CodePipeline` even though my project builds on my dev machine

## Error

```bash
[yarn run v1.22.19
[$ npx projen build
build » pre-compile | rm -rf lib
build » compile | tsc —build
Killed
Task "build » compile" failed when executing "tsc —build" (cwd: /codebuild/output/src728343998/src/packages/myPackage)
```

First, add `--verbose` to your package’s `compileTask` to see what is the error. You may see a little bit more:

```bash
[yarn run v1.22.19
[$ npx projen build
build » pre-compile | rm -rf lib
build » compile | tsc —build —verbose
3:18:29 AM - Projects in this build:
tsconfig.json
3:18:30 AM - Project 'tsconfig.json' is out of date because output file 'lib/index.js' does not exist # <-- this is something new
3:18:30 AM - Building project '/codebuild/output/src728343998/src/packages/myPackage/tsconfig.json'...
Killed
Task "build » compile" failed when executing "tsc —build —verbose" (cwd: /codebuild/output/src728343998/src/packages/myPackage)
```

## Possible solutions

1. Try to run `yarn eslint` and see if that was the problem. If you have changes in the repo, push it to `monorepo`.

2. Try to upsize the pipeline’s `codeBuild` build environment. The default environment has only **3GB of RAM and 2vCPUs** which may **not** be sufficient to handle large projects:

```ts
const this.pipeline = new PDKPipeline(this, "AppPipeline", {
  ...,
  codeBuildDefaults: {
    buildEnvironment: {
      computeType: ComputeType.LARGE, // or MEDIUM or X2_LARGE
    },
   },
});
```

After the change, deploy your pipeline **manually** because self-mutation won’t be in effect until the code builds.
