---
title: open-api-gateway workspace removal
tags: smithy, open-api-gateway, workspaces, package-json
packages: open-api-gateway
---

# OpenApiGatewayTsProject / SmithyApiGatewayTsProject “internal” workspace is not necessary after creation

Leaving the workspaces in the project’s package.json may mess with some processes, e.g.: generating typedoc documentation.

To remove:

```ts
mySmithyApiProject
  .tryFindObjectFile("package.json")
  ?.addDeletionOverride("workspaces");
```
