---
title: Override pre-defined tasks
tags: tsc, projen, tasks
packages: nx-monorepo, typescript-project
---

# I want to change a “pre-defined” task (e.g.: add --verbose to a tsc compile task)

Use the `reset` function:

```ts
myPackage.compileTask.reset("tsc --build --verbose");
```
