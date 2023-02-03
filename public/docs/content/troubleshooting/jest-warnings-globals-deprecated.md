---
title: Jest deprecated warnings
tags: jest
packages: nx-monorepo
---

# I’m getting Jest `(WARN) Define ts-jest config under globals is deprecated` warnings

## The warning

```bash
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
     <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
```

## Solution

Add `jestOptions` when you extend or instantiate `NxMonorepoProject`:

```ts
jestOptions: {
  jestConfig: {
    transform: {
      "\\.[jt]sx?$": ["ts-jest", { tsconfig: "tsconfig.dev.json" }],
    },
  },
},
```
