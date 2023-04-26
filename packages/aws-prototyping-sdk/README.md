> **DEPRECATION NOTICE:** The `aws-prototyping-sdk` is on path to deprecation. This package is simply a wrapper around the individual `@aws-prototyping-skd/*` packages and has no unique code aside from bundling the other packages. Due to lack of significant value compared to maintenance overhead, this package will be deprecated soon in favor of using the individual packages directly. Please use the individual packages starting now to prevent future migration and loss of update capabilities.

The aws-prototyping-sdk provides stable CDK and Projen constructs, allowing developers to have access to higher level abstractions than provided by the CDK or Projen alone.

For detailed documentation, please refer to the [documentation website](https://aws.github.io/aws-prototyping-sdk/).

## Bundling

This package simply bundles various packages from the `@aws-prototyping-sdk` namespace which have been marked as `stable`. As such, not all constructs or classes may be exported from this package and will need to be explicitly imported by creating a dependency on the individual packages.

To illustrate, at the time of writing the following individual packages are published:

```
@aws-prototyping-sdk
        |_ pipeline       : [stable]
        |_ nx-monorepo    : [stable]
        |_ static-website : [experimental]
        |_ identity       : [experimental]
```

The aws-prototyping-sdk package will bundle all stable packages and export them as namespaces as follows:

```
aws-prototyping-sdk
        |_ pipeline
        |_ nx_monorepo
```

This means if you wanted to access the PDKPipeline which is a stable construct, you simply add a dependency on the `aws-prototyping-sdk` and import it as follows:

```ts
import { nx_monorepo, pipeline } from "aws-prototyping-sdk";
```

To import `experimental` constructs, a dependency on the individual package is required. In the case of `static-website`, a dependency on `@aws-prototyping-sdk/static-website` is required. The constructs can then be imported as follows:

```ts
import { StaticWebsite } from "@aws-prototyping-sdk/static-website";
```
