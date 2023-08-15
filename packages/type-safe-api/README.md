# Type Safe API

Define your APIs using [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and leverage the power of generated client and server types, infrastructure, documentation, and automatic input validation!

This package vends a projen project type which allows you to define an API using either [Smithy](https://smithy.io/2.0/) or [OpenAPI v3](https://swagger.io/specification/), and a construct which manages deploying this API in API Gateway, given an integration (eg a lambda) for every operation.

The project will generate "runtime" projects from your API definition in your desired languages, which can be utilised both client side for interacting with your API, or server side for implementing your API. The project also generates a type-safe CDK construct which ensures an integration is provided for every API operation.

Code is generated at build time, so when you change your API model, just rebuild and you'll see your changes reflected in the generated code.

### Project Structure

The `TypeSafeApiProject` projen project will create the following directory structure within its `outdir`:

```
|_ model/
    |_ src/
        |_ main/
            |_ smithy - your API definition if you chose ModelLanguage.SMITHY
            |_ openapi - your API definition if you chose ModelLanguage.OPENAPI
|_ generated/
    |_ runtime/ - generated types, client, and server code in the languages you specified
        |_ typescript
        |_ python
        |_ java
    |_ infrastructure/ - generated infrastructure (you'll find only one directory in here based on your chosen infrastructure language)
        |_ typescript
        |_ python
        |_ java
    |_ documentation/ - generated documentation in the formats you specified
        |_ html2
        |_ html_redoc
        |_ plantuml
        |_ markdown
    |_ library/ - generated libraries if specified
        |_ typescript-react-query-hooks
```

### Getting Started

Please see the [Getting Started Guide](docs/developer_guides/type-safe-api/index.md) for how to get started!

### Developer Guides

For more information about Type Safe API, take a look at the developer guides:

- [Using Smithy](docs/developer_guides/type-safe-api/using_smithy.md)
- [Using OpenAPI](docs/developer_guides/type-safe-api/using_openapi.md)
- [Integrations](docs/developer_guides/type-safe-api/integrations.md)
- [Mocking Responses](docs/developer_guides/type-safe-api/mocking_responses.md)
- [Authorizers](docs/developer_guides/type-safe-api/authorizers.md)
- [Lambda Handlers](docs/developer_guides/type-safe-api/lambda_handlers.md)
- [React Query Hooks](docs/developer_guides/type-safe-api/typescript_react_query_hooks.md)
- [API Keys](docs/developer_guides/type-safe-api/api_keys.md)

### Walkthroughs

For detailed end-to-end examples, take a look at the walkthroughs:

- [Custom Integration: ECS and NLB](docs/walkthroughs/type-safe-api/custom_integration_ecs.md)

You can also check out the [Frequently Asked Questions](docs/faqs/type-safe-api/index.md).
