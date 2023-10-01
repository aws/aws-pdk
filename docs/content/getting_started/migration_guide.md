# Migration Guide

On the 31/08/2023, the AWS Prototyping SDK was re-branded to AWS Project Development Kit or **AWS PDK** for short. All further features, bug-fixes and security patches will be incorporated into the new re-branded AWS PDK. As part of this rebranding, several breaking changes were introduced which will require existing users to upgrade to the new version.

The following guide outlines all breaking changes, along with code snippets on how to resolve these issues:

## Prerequisites

- [Install the PDK CLI](./index.md#install-the-aws-pdk)

## New published packages

The largest change to the AWS PDK is to do with how it is now distributed. Previously, multiple packages were distributed to NPM, PYPI and Maven. Whilst this does provide a more granular experience, it comes at the cost of ease of use. Upon feedback from customers, we now only release a single distributable per language which is located as follows:

- NPM:   https://www.npmjs.com/package/@aws/pdk
- PYPI:  https://pypi.org/project/aws-pdk/
- Maven: https://mvnrepository.com/artifact/software.aws/pdk

What this means from your perspective is you need to perform the following steps in order:

### Step 1: Add the new AWS PDK dependency to .projenrc.ts

We need to upgrade our dependencies to consume the new AWS PDK packages, to do so first add a dependency to the new AWS PDK package in all constructs that have an existing dependency on the old Prototyping SDK packages. Run `pdk` from the root directory in order to add and install the new dependency.

```diff
import { CloudscapeReactTsWebsiteProject } from "@aws-prototyping-sdk/cloudscape-react-ts-website";
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import {
    DocumentationFormat,
    Language,
    Library,
    ModelLanguage,
    TypeSafeApiProject,
} from "@aws-prototyping-sdk/type-safe-api";
import { javascript } from "projen";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";

const monorepo = new NxMonorepoProject({
    defaultReleaseBranch: "main",
    npmignoreEnabled: false,
    devDeps: [
+       "@aws/pdk",
        "@aws-prototyping-sdk/nx-monorepo",
        "@aws-prototyping-sdk/type-safe-api",
        "@aws-prototyping-sdk/cloudscape-react-ts-website",
    ],
    name: "monorepo",
    packageManager: javascript.NodePackageManager.PNPM,
    projenrcTs: true,
    prettier: true,
    disableNodeWarnings: true,
});

const api = new TypeSafeApiProject({
    parent: monorepo,
    outdir: "packages/api",
    name: "myapi",
    model: {
        language: ModelLanguage.SMITHY,
        options: {
            smithy: {
                serviceName: {
                    namespace: "com.amazon",
                    serviceName: "MyApi",
                },
            },
        },
    },
    runtime: {
        languages: [Language.TYPESCRIPT],
    },
    infrastructure: {
        language: Language.TYPESCRIPT,
    },
    library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
    },
    documentation: {
        formats: [DocumentationFormat.HTML2],
    },
});

const website = new CloudscapeReactTsWebsiteProject({
    packageManager: javascript.NodePackageManager.PNPM,
    parent: monorepo,
    outdir: "packages/website",
    defaultReleaseBranch: "main",
    name: "website",
    deps: [
        api.library.typescriptReactQueryHooks!.package.packageName,
    ],
});

new AwsCdkTypeScriptApp({
    packageManager: javascript.NodePackageManager.PNPM,
    parent: monorepo,
    outdir: "packages/infra/main",
    cdkVersion: "2.1.0",
    defaultReleaseBranch: "main",
    npmignoreEnabled: false,
    prettier: true,
    name: "infra-main",
    deps: [
+       "@aws/pdk",        
        "@aws-prototyping-sdk/static-website",
        "@aws-prototyping-sdk/identity",
        "@aws-prototyping-sdk/pipeline",
        "@aws-prototyping-sdk/pdk-nag",
        "@aws-prototyping-sdk/cdk-graph-plugin-diagram",
        "@aws-prototyping-sdk/cdk-graph",
        "@aws-prototyping-sdk/aws-arch",
        "@aws-prototyping-sdk/type-safe-api",
        "@aws-cdk/aws-cognito-identitypool-alpha",
        api.infrastructure.typescript!.package.packageName,
        api.runtime.typescript!.package.packageName,
        website.package.packageName,
    ],
});

monorepo.synth();
```

### Step 2: Refactor to use the new dependency in .projenrc.ts

Now that the new dependency is installed, we can perform the following modifications:

- Update imports to source the constructs from the new `@aws/pdk` package
- Name the `NXMonorepoProject` to `MonorepoTsProject`
- Remove all old dependencies

```diff
-import { CloudscapeReactTsWebsiteProject } from "@aws-prototyping-sdk/cloudscape-react-ts-website";
-import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
-import {
-    DocumentationFormat,
-    Language,
-    Library,
-    ModelLanguage,
-    TypeSafeApiProject,
-} from "@aws-prototyping-sdk/type-safe-api";
-import { javascript } from "projen";
-import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
-
-const monorepo = new NxMonorepoProject({
+import { CloudscapeReactTsWebsiteProject } from "@aws/pdk/cloudscape-react-ts-website";
+import { MonorepoTsProject } from "@aws/pdk/monorepo";
+import {
+    DocumentationFormat,
+    Language,
+    Library,
+    ModelLanguage,
+    TypeSafeApiProject,
+} from "@aws/pdk/type-safe-api";
+import { javascript } from "projen";
+import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
+
+const monorepo = new MonorepoTsProject({
...
```

Once all the changes have been made, we can run `pdk` from the root to synthesize our changes.

### Step 3: Update all application code imports

Whilst your project should synth successfully, it most likely will fail to build as your application code will still have imports referencing the old package locations. The easiest way to remedy this is to do a find-replace to use the new import name.

Once you are confident that all imports are referencing the name AWS PDK package, run `pdk build` from the root directory. If it succeeds you should be good to go.

## Changes to the CdkGraphPluginDiagram interface

In order to make this construct truly cross-platform, we had to make a slight tweak to the way filters are defined in typescript. As such, any existing filters will need to be wrapped in an additional wrapper i.e: `{ store: <previousFilter>}`

```diff
const graph = new CdkGraph(app, {
    plugins: [
        new CdkGraphDiagramPlugin({
            defaults: {
            filterPlan: {
                preset: FilterPreset.COMPACT,
                filters: [
-                    Filters.pruneCustomResources(),
-                    (store) => {
-                        // do something
-                    },
+                    { store: Filters.pruneCustomResources() },
+                    { 
+                        store: (store) => {
+                            // do something
+                        }
+                    },
                ],
            },
            },
        }),
    ],
});
```

## Removal of `PDKPipelineTsProject` construct

The `PDKPipelineTsProject` has been removed as it did not provide an adequate level of control of the generated pipeline. If you have instrumented this construct in your `projenrc.ts` file, you can simply change it to use `AwsCdkTypeScriptApp` instead and ensure the following:

- `sampleCode` property is set to false to prevent additional sample code being generated.
- `appEntrypoint` is set to `pipeline.ts` so that the synth command has the correct entrypoint.
- be sure to ensure the construct has a dependency on `@aws/pdk` as you will still be able to use the `PDKPipeline` CDK construct contained within `@aws/pdk/pipeline`.

```diff
-import { PDKPipelineTsProject } from "@aws-prototyping-sdk/pipeline";
+import { AwsCdkTypeScriptApp } from "projen/lib/awscdk"

-const pipelineProject = new PDKPipelineTsProject({
+const pipelineProject = new AwsCdkTypeScriptApp({    
    parent: monorepo,
    outdir: "packages/infra",
    defaultReleaseBranch: "mainline",
    name: "infra",
    cdkVersion: "2.1.0",
+   appEntrypoint: "pipeline.ts",
+   sampleCode: false,
    deps: [
+       "@aws/pdk",
-       "@aws-prototyping-sdk/pipeline",
-       "@aws-prototyping-sdk/static-website",
-       "@aws-prototyping-sdk/identity",
        "@aws-cdk/aws-cognito-identitypool-alpha@^2.66.1-alpha",
    ],
});
```

## TypeSafeApi Breaking Changes

### Request Parameters

#### Types

In the AWS Prototyping SDK, request parameters (query parameters, path parameters and header parameters) were provided to your handler methods or interceptors in two properties, "request parameters" and "request array parameters". These were typed as they were received by API Gateway without any marshalling, and as such no matter the types defined in your model, would be provided to your handlers as strings or string arrays.

In AWS PDK, request parameters can all be found in the same "request parameters" property of the input, and are automatically marshalled into the type defined in your model. This means that any additional type coercion logic you may have written in your lambda handlers may need to be removed.

For example, suppose we have an `Increment` operation defined in Smithy:

```smithy
@readonly
@http(uri: "/increment", method: "GET")
operation Increment {
    input := {
        @required
        @httpQuery("value")
        value: Integer
    }
    output := {
        @required
        result: Integer
    }
}
```

Previously, the `value` would be provided in `input.requestParameters.value` as a string, and your handler would have to handle converting it to a number (and returning an error response if it was not a number). Now, `value` is already converted to a number for you, and the handler wrapper will automatically respond with a `400` status code if the provided request parameter is not of the appropriate type.

```diff
import { incrementHandler, Response } from "myapi-typescript-runtime";

export const handler = incrementHandler(async ({ input }) => {
-    const numberValue = Number(input.requestParameters.value);
-    if (isNaN(numberValue)) {
-        return Response.badRequest({
-            message: 'value must be a number',
-        });
-    }
    return Response.success({
-        result: numberValue + 1,
+        result: input.requestParameters.value + 1,
    });
});
```

!!!warning
    Request parameters have been restricted to only "primitives" (`number`, `integer`, `string` and `boolean`) or arrays of primitives, since this is the set of request parameters Smithy supports. Note also that a `string` of `date` or `date-time` format will be coerced into a language specific date object.

    While OpenAPI supports encoding objects as request parameters using various schemes, these are not supported by Type Safe API and you will receive a validation error if you specify `object` request parameters in your OpenAPI spec.

#### TypeScript Interceptors

You may have previously defined interceptors in TypeScript which referenced the `RequestArrayParameters` type in their type signature. Since all request parameters have been merged into a single `RequestParameters` type, `RequestArrayParameters` must be deleted from your interceptor type signatures:

```diff
import {
    sayHelloHandler,
    ChainedRequestInput,
    OperationResponse,
} from "myapi-typescript-runtime";

const tryCatchInterceptor = async <
    RequestParameters,
-    RequestArrayParameters,
    RequestBody,
    Response extends OperationResponse<number, any>
>(
    request: ChainedRequestInput<
    RequestParameters,
-    RequestArrayParameters,
    RequestBody,
    Response
    >
): Promise<Response | OperationResponse<500, { message: string }>> => {
    try {
        return await request.chain.next(request);
    } catch (e: any) {
        return { statusCode: 500, body: { message: e.message } };
    }
};
```

### Python Runtime Package

The Python Runtime package has been migrated to use the latest python generator (`python-nextgen` in [OpenAPI Generator v6](https://github.com/OpenAPITools/openapi-generator/releases/tag/v6.6.0), and renamed to `python` in [v7](https://github.com/OpenAPITools/openapi-generator/releases/tag/v7.0.0)).

As such, there are some breaking changes which will apply to any code using the models:

#### Property Access

Properties of models or request parameters previously needed to be accessed using dictionary notation, while they are now referenced through dot notation:

```diff
from myapi_python_runtime.model.say_hello_response_content import SayHelloResponseContent
from myapi_python_runtime.api.operation_config import say_hello_handler,
    SayHelloRequest, SayHelloOperationResponses, ApiResponse

@say_hello_handler
def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
-    return ApiResponse(
-        status_code=200,
-        body=SayHelloResponseContent(message="Hello {}".format(input.request_parameters["name"])),
-        headers={}
-    )
+    return Response.success(SayHelloResponseContent(
+        message="Hello {}".format(input.request_parameters.name)
+    ))
```

#### Import Path for Handler Wrappers

The import path has changed for handler wrappers, so you will need to adjust your imports accordingly:

Previously handler wrappers were imported from `<runtime-package-name>.apis.tags.default_api_operation_config`, now they are imported from `<runtime-package-name>.api.operation_config`:

```diff
from myapi_python_runtime.model.say_hello_response_content import SayHelloResponseContent
-from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler,
-    SayHelloRequest, SayHelloOperationResponses, ApiResponse
+from myapi_python_runtime.api.operation_config import say_hello_handler,
+    SayHelloRequest, SayHelloOperationResponses, ApiResponse
+from myapi_python_runtime.response import Response

@say_hello_handler
def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
    return ApiResponse(
        status_code=200,
        body=SayHelloResponseContent(message="Hello {}".format(input.request_parameters["name"])),
        headers={}
    )
```

### Java Runtime Package

Previously in AWS Prototyping SDK, all classes pertaining to all operations were vended as static subclasses of the `Handlers` class.

In AWS PDK, these classes have been moved out from `Handlers` as their own standalone classes. Additionally, classes are grouped under a package namespace for the particular operation.

```diff
package com.my.api;

-import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello;
-import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello200Response;
-import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloRequestInput;
-import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloResponse;
+import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello;
+import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello200Response;
+import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloRequestInput;
+import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloResponse;
import com.generated.api.myapijavaruntime.runtime.model.SayHelloResponseContent;

public class SayHelloHandler extends SayHello {
    @Override
    public SayHelloResponse handle(SayHelloRequestInput request) {
        return SayHello200Response.of(SayHelloResponseContent.builder()
                .message(String.format("Hello %s", request.getInput().getRequestParameters().getName()))
                .build());
    }
}
```

## Troubleshooting
### Missing Polyfill

If you see this error:

```
Module not found: Error: Can't resolve 'http' in '/Users/xxx/my-project/node_modules/.pnpm/@aws-lambda-powertools+tracer@1.12.1/node_modules/@aws-lambda-powertools/tracer/lib/provider'
BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
This is no longer the case. Verify if you need this module and configure a polyfill for it.
```

This is most likley caused by your website having a direct dependency on the typescript runtime package, since the runtime package has all the server side handlers which is not suitable in a web based context. Ideally your website should only depend on the hooks package, even if you just use the generated client and not the hooks.