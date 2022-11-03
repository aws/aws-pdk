---
title: Disable sample code generation
tags: projen
packages: typescript-project
---

# I don’t want `projen` to generate sample code and tests

```ts
const myPackage = new TypeScriptProject({
  parent: this.monorepoProject,
  outdir: "packages/my-package",
  defaultReleaseBranch: this.defaultReleaseBranch,
  name: "my-package",
  sampleCode: false, // <-------- turn off sampleCode
});
```
