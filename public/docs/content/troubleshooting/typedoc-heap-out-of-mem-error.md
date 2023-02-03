---
title: Typedoc JS heap out of mem error
tags: typedoc, projen, codepipeline
packages: typescript-project, cloudscape-react-ts-website
---

# `typedoc` fails while generating docs with `Javascript heap out of memory error`

Set `max_old_space_size` in `NODE_OPTIONS`:

```ts
myMonoRepo.addTask("doc:generate", {
  exec: "NODE_OPTIONS=--max_old_space_size=16384 npx typedoc", // experiment with the value needed
});
```

> Note: Make sure there is enough RAM in your code build environment if you automate this using `CodePipeline`.
