---
title: Package-level typedoc config
tags: package-json, typedoc
packages: typescript-project, cloudscape-react-ts-website
---

# Fine-tune `typedoc` configuration inside packages

```ts
myProject.addFields({
  typedoc: {
    entryPoint: "src/index.ts",
    readmeFile: "./README.md",
    displayName: "My Project",
    tsConfig: "./tsconfig.json"
  }
});
```

Check the typedoc docs for setting up for monorepo: <https://typedoc.org/guides/monorepo/>
