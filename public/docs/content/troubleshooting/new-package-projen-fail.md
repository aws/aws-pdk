---
title: How to add new project
tags: projen
packages: nx-monorepo, typescript-project
---

# I create a new package in my project, but running `npx projen` fails

Make sure that when you create a new package you don’t set any interdependencies neither for the package nor of the package.
Dependencies accessible from npm repo are ok.
Otherwise, you get an error message that some dependencies are not available.

## 1 - Create the package

```ts
// STEP 1 -- create the package
new TypeScriptProject({
  parent: this.monorepoProject,
  outdir: "packages/my-package",
  defaultReleaseBranch: this.defaultReleaseBranch,
  name: "my-package",
  deps: [
    "aws-cdk-lib", // <-- this is ok
    "constructs",
    myOtherPackage.package.packageName // <-- DON'T ADD dependency to other package
    ],
  devDeps: []
});
```

## 2 - run `npx projen`

```bash
# Step 2 -- run `npx projen`
npx projen
```

## 3 - Assign to variable

```ts
// STEP 3 - Assign to variable
const myPackage = new TypeScriptProject({ // <--- you can assign to a variable now
  parent: this.monorepoProject,
  outdir: "packages/my-package",
  defaultReleaseBranch: this.defaultReleaseBranch,
  name: "my-package",
  deps: [
    "aws-cdk-lib",
    "constructs",
    myOtherPackage.package.packageName // <-- you can add a dependency now
    ],
  devDeps: []
});

const myOtherPackage2 = new TypeScriptProject({
  ...,
  deps: [
    ...,
    myPackage.package.packageName // <-- you can add dependency to your new package in another package
  ]
});
```

## 4 - run `npx projen` again

```bash
# STEP 4 -- run "npx projen" again
npx projen
```
