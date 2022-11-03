---
title: Cognito Auth Middleware
tags: cognito, middleware
packages: cloudscape-react-ts-website, open-api-gateway
---

# How do I setup a Cognito Auth Middleware for a generated Smithy/Open API client?

```ts
import { Middleware } from "@myProject/my-openapi-project-generated-typescript";
import { Auth as AmplifyAuth } from "aws-amplify";

const cognitoAuthMiddleware: Middleware = {
  pre: async ({ init, url }) => ({
    url,
    init: {
      ...init,
      headers: {
        ...init.headers,
        "Content-Type": "application/json",
        Authorization: (await AmplifyAuth.currentSession())
          .getIdToken()
          .getJwtToken(),
      },
    },
  }),
};
```
