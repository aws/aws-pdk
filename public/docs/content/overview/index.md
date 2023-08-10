## Introduction to PDK

The AWS Prototyping SDK (PDK) aims to accelerate the development of prototypes on AWS. To achieve this, it provides building blocks for common patterns together with development tools to manage and build your projects. The constructs are based on [AWS CDK](https://github.com/aws/aws-cdk) and implement an expanding number of common application/infrastructure patterns, such as the ability to generate complete client and infrastructure code for a REST API from an OpenAPI specification. The project and build tools the PDK provide allows you manage the configuration of multiple related projects in a language-agnostic way, and to efficiently execute parallel incremental builds.

This combination of project management, build execution, and CDK constructs reduce the effort involved in prototyping new ideas on AWS, and allow developers to seamlessly grow these ideas beyond the prototype phase without requiring a complete re-implementation of the original solution. In addition to the foundation of project configuration and build dependency management provided by the nx-monorepo project, PDK also provides a number of other projen projects (some of which implement common infrastructure patterns using CDK) and stand-alone CDK constructs, which are described below. Note: PDK is currently pre-release, targeting version 1.0 for mid-2023.

## About core modules

The AWS Prototyping SDK (PDK) provides building blocks for common patterns to help you manage and build your projects. Before you get started with PDK, this is a introduction of the core modules.

For more information on these modules, refer to the [core modules](/public/docs/content/getting_started/core_modules.md) page.

- nx-monorepo
- static-website
- cloudscape-react-ts-website
- type-safe-api
- pipeline
- pdk-nag
- cdk-graph
- identity

## Code of conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## License

See the [LICENSE](/LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.

[def]: LICENSE