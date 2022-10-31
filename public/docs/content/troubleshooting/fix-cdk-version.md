---
title: Custom CDK version
tags: cdk, constructs, versioning, resolutions
packages: nx-monorepo
---

# I want to use a fixed CDK/Constructs package version

```ts
const cdkVersion = ...;
const constructsVersion = ...;

monorepo.tryFindObjectFile("package.json")?.addOverride("resolutions", {
  "**/aws-cdk-lib": cdkVersion,
  "**/constructs": constructsVersion,
})
```
