---
title: Unresolved resource dependencies error
tags: cdk, stack
packages: static-website, pipeline
---

# Passing parameters between CDK stacks will cause `Unresolved resource dependencies` error while trying to deploy

## Links

* [Cross stack values do not work with Source.data/jsonData [CDK github]](https://github.com/aws/aws-cdk/issues/19257)
* [Nested stack runtime-config.json properties [PDK github]](https://github.com/aws/aws-prototyping-sdk/issues/84)

## TLDR;

1. Create SSM Parameters in the stack where you create e.g.: a `userPool`

    ```ts
    // in UserIdentityStack
    this.userIdentity = new UserIdentity(this, "UserIdentity");

    new StringParameter(this, "userPoolIdSsmParam", {
      parameterName: ssmParamNames.userPoolId,
      stringValue: this.userIdentity.userPool.userPoolId,
    });
    ```

2. Setup explicit dependencies between stacks/constructs

    ```ts
    // in ApplicationStack
    websiteStack.node.addDependency(userIdentityStack);
    ```

3. Use already created SSM Parameters in the dependent stack

    ```ts
    // in WebsiteStack
    const userPoolIdParam = StringParameter.fromStringParameterName(this, "userPoolIdSsmParam", ssmParamNames.userPoolId);

    const website = new StaticWebsite(this, "Website", {
      websiteContentPath: ...,
      runtimeOptions: {
        jsonPayload: {
          ...,
          userPoolId: userPoolIdParam.stringValue,
          ...,
        }
      }
    })
    ```
