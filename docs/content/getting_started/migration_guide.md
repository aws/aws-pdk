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

=== "BEFORE"

    ```typescript
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

=== "AFTER"

    ```typescript hl_lines="17 79"
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
            "@aws/pdk", // Add the new dep
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
            "@aws/pdk", // Add the new dep
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

```typescript hl_lines="1-14"
import { CloudscapeReactTsWebsiteProject } from "@aws/pdk/cloudscape-react-ts-website";
import { MonorepoTsProject } from "@aws/pdk/nx-monorepo";
import {
    DocumentationFormat,
    Language,
    Library,
    ModelLanguage,
    TypeSafeApiProject,
} from "@aws/pdk/type-safe-api";
import { javascript } from "projen";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";

// Ensure you change the class name and import to use MonorepoTsProject as it has changed
const monorepo = new MonorepoTsProject({
    defaultReleaseBranch: "main",
    npmignoreEnabled: false,
    devDeps: [
        "@aws/pdk",
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
        "@aws-pdk",
        "@aws-cdk/aws-cognito-identitypool-alpha",
        api.infrastructure.typescript!.package.packageName,
        api.runtime.typescript!.package.packageName,
        website.package.packageName,
    ],
});

monorepo.synth();
```

Once all the changes have been made, we can run `pdk` from the root to synthesize our changes.

### Step 3: Update all application code imports

Whilst your project should synth successfully, it most likely will fail to build as your application code will still have imports referencing the old package locations. The easiest way to remedy this is to do a find-replace to use the new import name.

Once you are confident that all imports are referencing the name AWS PDK package, run `pdk build` from the root directory. If it succeeds you should be good to go.

## Changes to the CdkGraphPluginDiagram interface

In order to make this construct truly cross-platform, we had to make a slight tweak to the way filters are defined in typescript. As such, any existing filters will need to be wrapped in an additional wrapper i.e: `{ store: <previousFilter>}`

=== "BEFORE"

    ```typescript
    const graph = new CdkGraph(app, {
        plugins: [
        new CdkGraphDiagramPlugin({
            defaults: {
            filterPlan: {
                preset: FilterPreset.COMPACT,
                filters: [
                    Filters.pruneCustomResources(),
                    (store) => {
                        // do something
                    },
                ],
            },
            },
        }),
        ],
    });
    ```

=== "AFTER"

    ```typescript hl_lines="8-13"
    const graph = new CdkGraph(app, {
        plugins: [
        new CdkGraphDiagramPlugin({
            defaults: {
            filterPlan: {
                preset: FilterPreset.COMPACT,
                filters: [
                    { store: Filters.pruneCustomResources() },
                    { 
                        store: (store) => {
                            // do something
                        }
                    },
                ],
            },
            },
        }),
        ],
    });
    ```

## Removal of `PDKPipelineTsProject` construct

The `PDKPipelineTsProject` has been removed as it did not provide an adequate level of control of the generated pipeline. If you have instrumented this construct in your `projenrc.ts` file, you can simply change it to use `AwsCdkTypeScriptApp` instead and ensure the `sample` property is set to false to prevent additional sample code being generated. Be sure to ensure the construct has a dependency on `@aws/pdk` as you will still be able to use the `PDKPipeline` CDK construct contained within `@aws/pdk/pipeline`.

## TypeSafeApi breaking changes

- TypeSafeApi Python runtime moved to new python-nextgen OpenAPI generator, which means:
  - Properties of models can be referenced as attributes rather than dictionary syntax (eg .my_property rather than ["my_property"]).
  - Models are now serialised and deserialised using the .from_json and .to_json methods.
  - request_parameters and request_array_parameters are also models.
- TypeSafeApi Python handlers import location changed from <package>.apis.tags.default_api_operation_config to <package>.api.operation_config.
- TypeSafeApi Java classes for handlers/interceptors in runtime are no longer static subclasses of the Handlers class. The import location has changed from eg <package>.api.Handlers.SayHello to <package>.api.handlers.say_hello.SayHello.