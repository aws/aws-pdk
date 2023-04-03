# aws-prototyping-sdk

## Introduction

The AWS Prototyping SDK (PDK) aims to accelerate the development of prototypes on AWS. To achieve this, it provides building blocks for common patterns together with development tools to manage and build your projects. The constructs are based on [AWS CDK](https://github.com/aws/aws-cdk) and implement an expanding number of common application/infrastructure patterns, such as the ability to generate complete client and infrastructure code for a REST API from an OpenAPI specification. The project and build tools the PDK provide allows you manage the configuration of multiple related projects in a language-agnostic way, and to efficiently execute parallel incremental builds.

This combination of project management, build execution, and CDK constructs reduce the effort involved in prototyping new ideas on AWS, and allow developers to seamlessly grow these ideas beyond the prototype phase without requiring a complete re-implementation of the original solution. In addition to the foundation of project configuration and build dependency management provided by the nx-monorepo project, PDK also provides a number of other projen projects (some of which implement common infrastructure patterns using CDK) and stand-alone CDK constructs, which are described below. Note: PDK is currently pre-release, targeting version 1.0 for mid-2023.

## Core Modules

### [nx-monorepo](./packages/nx-monorepo/README.md)

Modern applications are often implemented across multiple packages or libraries, each potentially implemented in a different language. To help manage the complexity that arises from this, PDK provides a [Projen](https://github.com/projen/projen) project called 'nx-monorepo' to support dependency management and builds across packages. Together with the project-as-code provided by Projen, this project utilises [Nx Build](https://nx.dev/) to give developers the ability to manage a collection of different projects within a single repository. Nx Build allows for explicit and implicit dependency management between polyglot projects, and provides shared caching and parallel task execution for super fast builds across multiple languages with ease. By combining Projen and NX Build, 'nx-monorepo' reduces the effort involved in maintaining and building related projects implemented in a mix of languages.

### [static-website](./packages/static-website/README.md)

This module provides a high-level CDK construct that is able to deploy your pre-packaged static website content into an S3 Bucket, fronted by Cloudfront. This module uses an Origin Access Identity to ensure your Bucket can only be accessed via Cloudfront and is configured to only allow HTTPS requests by default.

### [cloudscape-react-ts-website](./packages/cloudscape-react-ts-website/README.md)

This module provides a projen project that has a default directory structure and resources for an empty React website that utilises the Cloudscape design system. This can be used in tandem with the 'static-website' and 'identity' modules to deploy infrastructure to host and provide identity management to host and secure the website content.

### [type-safe-api](./packages/type-safe-api/README.md)

This module provides a projen project that allows you to define an API using either Smithy or OpenAPI v3, and a construct which manages deploying this API in API Gateway, given an integration (eg a lambda) for every operation. It generates type-safe CDK constructs, client, and server code to help you rapidly implement and integrate with your API.

### [pipeline](./packages/pipeline/README.md)

This module provides a projen project that uses a construct based on CDK's CodePipeline construct, named PDKPipeline, to deploy a CI/CD pipeline. It additionally creates a CodeCommit repository and by default is configured to build the project assuming nx-monorepo is being used (although this can be changed). A Sonarqube Scanner can also be configured to trigger a scan whenever the synth build job completes successfully. This Scanner is non-blocking and as such is not instrumented as part of the pipeline.

### [pdk-nag](./packages/pdk-nag/README.md)

This module provides a helper utility that automatically configures [CDKNag]('https://github.com/cdklabs/cdk-nag') within your application, which validates that the state of constructs within a given scope comply with a given set of rules. Additionally, cdk-nag provides a rule suppression and compliance reporting system. cdk-nag validates constructs by extending [AWS CDK Aspects]('https://docs.aws.amazon.com/cdk/v2/guide/aspects.html').

### [cdk-graph](./packages/cdk-graph/README.md)

This module provides a core framework for supporting additional CDK based automation and tooling, such as diagramming, cost modeling, and security and compliance. Currently, it delivers the following functionality:

1. Synthesizes a serialized graph (nodes and edges) from CDK source code.
1. Provides runtime interface for interacting with the graph (in-memory database-like graph store).
1. Provides plugin framework for additional tooling to utilize and extend the graph.

### [identity](./packages/identity/README.md)

This module provides a CDK derived construct that can be added to existing CDK project to deploy a configurable Identity Provider with a default Cognito User Pool. It does not depend on projen and can be utilised as an import in an existing CDK application.

## Prerequisites

Ensure you have the following packages installed globally:

* [pnpm](https://pnpm.io/installation)
* [node > 14](https://nodejs.org/en/download/package-manager/) (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install)
* [Python >= 3.7](https://www.python.org/downloads/)
* [Java >= 8](https://aws.amazon.com/fr/corretto/) and [Maven >= 3.6](https://maven.apache.org/download.cgi)

```bash
# from root directory of this package
pnpm i
```

## Quickstart

The [README for the 'nx-monorepo'](./packages/nx-monorepo/README.md) projen project provides an example of how to get started with PDK.

## Usage of projen/nx

This package is built using [projen](https://github.com/projen/projen) and [nx](https://nx.dev/getting-started/intro) as such all tasks should be invoked
via either:

- `pnpm nx run-many --target=<task> --all` - executes the `<task>` on every package, in dependency order.
- `pnpm nx run <package_name>:<task>` - executes the `<task>` on the specified `<package_name>`.

To build the full project, run `pnpm nx run-many --target=build --all`

Any change to `projects/*` or `.projenrc.ts` requires a synth to be executed. To do this, run: `pnpm projen` from the root directory.

## Nx workspace script alias
In addition to the above `pnpm nx <command>` format to execute commands, the workspace package contains useful alias for common tasks.

Executing `pnpm <task>` for common tasks will execute `pnpm nx run-many --target=<task> --output-style=stream --nx-bail`, such as `pnpm build` will execute `pnpx nx run-many --target=build --output-style=stream --nx-bail` across all packages.

All nx run-many alias scripts access additional arguments, such as to only run on specific projects you can use `pnpm build --projects=proj1,proj2`.
> See [Nx Run-Many options](https://nx.dev/packages/nx/documents/run-many#options) for details.

## Documentation

For documentation including examples and a full API reference, visit: [https://aws.github.io/aws-prototyping-sdk/](https://aws.github.io/aws-prototyping-sdk/)

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for more information.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
