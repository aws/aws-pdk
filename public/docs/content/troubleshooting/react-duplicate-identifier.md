---
title: React duplicate identifier error
tags: react, react-dom
packages: nx-monorepo, open-api-gateway, cloudscape-react-ts-website
---

# I get `react`-related duplicate identifier error

## The error

```bash
myPackage: ../../../../node_modules/@types/react/index.d.ts(3131,14): error TS2300: Duplicate identifier 'LibraryManagedAttributes'.
myPackage: ../../../../node_modules/@types/react-dom/node_modules/@types/react/index.d.ts(3131,14): error TS2300: Duplicate identifier 'LibraryManagedAttributes'.
myPackage: 👾 Task "build » compile" failed when executing "tsc --build" (cwd: /Users/<user>/projects/myProject/packages/myPackage/generated/typescript)
```

## Solution

`react-dom` depends on `@types/react@*` while `react` may have another version in your project, meaning multiple versions are present.

```ts
// fix react version example
monorepoProject.package.addPackageResolutions("@types/react@^18.0.21");
```
