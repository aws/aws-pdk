# Overview of core modules

The AWS Prototyping SDK (PDK) provides building blocks for common pattern, to help you manage and build your projects. Before you get started with PDK, this is a quick overview of the core modules.

### nx-monorepo

Modern applications are often implemented across multiple packages or libraries, each potentially implemented in a different language. To help manage the complexity that arises from this, PDK provides a [Projen](https://github.com/projen/projen) project called 'nx-monorepo' to support dependency management and builds across packages. Together with the project-as-code provided by Projen, this project utilises [Nx Build](https://nx.dev/) to give developers the ability to manage a collection of different projects within a single repository. Nx Build allows for explicit and implicit dependency management between polyglot projects, and provides shared caching and parallel task execution for super fast builds across multiple languages with ease. By combining Projen and NX Build, 'nx-monorepo' reduces the effort involved in maintaining and building related projects implemented in a mix of languages.

### static-website

This module provides a high-level CDK construct that is able to deploy your pre-packaged static website content into an S3 Bucket, fronted by Cloudfront. This module uses an Origin Access Identity to ensure your Bucket can only be accessed via Cloudfront and is configured to only allow HTTPS requests by default.

### cloudscape-react-ts-website

This module provides a projen project that has a default directory structure and resources for an empty React website that utilises the Cloudscape design system. This can be used in tandem with the 'static-website' and 'identity' modules to deploy infrastructure to host and provide identity management to host and secure the website content.

### type-safe-api

This module provides a projen project that allows you to define an API using either Smithy or OpenAPI v3, and a construct which manages deploying this API in API Gateway, given an integration (eg a lambda) for every operation. It generates type-safe CDK constructs, client, and server code to help you rapidly implement and integrate with your API.

### pipeline

This module provides a projen project that uses a construct based on CDK's CodePipeline construct, named PDKPipeline, to deploy a CI/CD pipeline. It additionally creates a CodeCommit repository and by default is configured to build the project assuming nx-monorepo is being used (although this can be changed). A Sonarqube Scanner can also be configured to trigger a scan whenever the synth build job completes successfully. This Scanner is non-blocking and as such is not instrumented as part of the pipeline.

### pdk-nag

This module provides a helper utility that automatically configures [CDKNag]('https://github.com/cdklabs/cdk-nag') within your application, which validates that the state of constructs within a given scope comply with a given set of rules. Additionally, cdk-nag provides a rule suppression and compliance reporting system. cdk-nag validates constructs by extending [AWS CDK Aspects]('https://docs.aws.amazon.com/cdk/v2/guide/aspects.html').

### cdk-graph

This module provides a core framework for supporting additional CDK based automation and tooling, such as diagramming, cost modeling, and security and compliance. Currently, it delivers the following functionality:

1. Synthesizes a serialized graph (nodes and edges) from CDK source code.
1. Provides runtime interface for interacting with the graph (in-memory database-like graph store).
1. Provides plugin framework for additional tooling to utilize and extend the graph.

### identity

This module provides a CDK derived construct that can be added to existing CDK project to deploy a configurable Identity Provider with a default Cognito User Pool. It does not depend on projen and can be utilised as an import in an existing CDK application.