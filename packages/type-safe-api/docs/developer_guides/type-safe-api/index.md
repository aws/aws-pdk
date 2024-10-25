# Type Safe API

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/type-safe-api/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/type-safe-api)

> Define your REST or WebSocket API's declaratively in a type-safe manner to reduce preventable issues and increase overall productivity.

The _type-safe-api_ package provides projen projects which allow you to define a REST or WebSocket API using [Smithy](https://smithy.io/2.0/), [TypeSpec](https://typespec.io/) or [OpenAPI v3](https://swagger.io/specification/), and constructs which manage deploying these APIs on API Gateway.

You can define your APIs using [Smithy](https://smithy.io/2.0/), [TypeSpec](https://typespec.io/) or [OpenAPI v3](https://swagger.io/specification/), and leverage the power of generated client and server types, infrastructure, documentation, and automatic input validation.

!!! note

    WebSocket APIs are currently considered experimental and only support generating TypeScript code.

## How does it work?

Use the projen projects vended by Type Safe API to create REST APIs and WebSocket APIs. Model your API in either Smithy, TypeSpec or OpenAPI. The project will generate type-safe clients, server-side bindings and CDK constructs in your desired languages so you can focus on implementing the business logic for your application.

!!! note

    The code is generated at build time, so when you change your API model, you will need to rebuild to see your changes reflected in the generated code.

The `TypeSafeApiProject` projen project creates a REST API, and produces the following directory structure within its `outdir`:

```
|_ model/
    |_ src - your model source, in Smithy, TypeSpec or OpenAPI depending on your selected model language
|_ handlers/
    |_ typescript - lambda handlers for operations you choose to implement in TypeScript
    |_ python - lambda handlers for operations you choose to implement in Python
    |_ java - lambda handlers for operations you choose to implement in Java
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
        |_ html_redoc
        |_ plantuml
        |_ markdown
    |_ library/ - generated libraries if specified
        |_ typescript-react-query-hooks
```

The `TypeSafeWebSocketApiProject` projen project is used to create a WebSocket API, and these projects have a similar structure.
