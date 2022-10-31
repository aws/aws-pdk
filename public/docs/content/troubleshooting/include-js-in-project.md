---
title: Include JS files
tags: projen, tsconfig
packages: typescript-project
---

# How do I include `js` files in my project?

## Option #1 - via `tsconfig`

```ts
const myPackage = new TypeScriptProject({
  // ...
  tsconfig: {
    compilerOptions: {
      allowJs: true, // <--------
    },
  },
  tsconfigDev: {
    compilerOptions: {
      allowJs: true, // <---------
    },
  },
});

myPackage.tsconfig?.addInclude("src/**/*.js");

// OR more specific path:
// myPackage.tsconfig?.addInclude("src/**/@lambda/**/*.js");
```

## Option #2 - with `rsync` ([example](https://github.com/aws/aws-prototyping-sdk/blob/392fb8c483a99123d4e8a8b6b95b5aa7ecb014b8/private/projects/nx-monorepo-project.ts#L39))

```ts
this.compileTask.exec(
  'rsync -a ./src/** ./lib --include="*/" --include="**/*.js" --exclude="*" --prune-empty-dirs'
);
```
