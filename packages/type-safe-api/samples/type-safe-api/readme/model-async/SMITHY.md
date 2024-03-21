# Smithy Model

This project defines the API operations and their inputs and outputs, using an interface definition language called [Smithy](https://smithy.io/2.0/).

The default entrypoint for the API is `src/main/smithy/main.smithy`. You can add more Smithy files (and subfolders) in the `src/main/smithy` directory, and these will be discovered as part of the project's build task.

Resources:
 - [Smithy Documentation](https://smithy.io/2.0/)
 - [Type Safe API Documentation](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html)

## Adding Operations

To add an operation, we can use the `operation` shape. It should be annotated with the `@async` trait, which defines the `direction` of an operation (either `server_to_client`, `client_to_server` or `bidirectional`). Each operation must have an `input`, and `output` and `errors` are not supported. You can define the `input` inline using the `:=` syntax.

```smithy
/// This is an example operation.
@async(direction: "server_to_client")
operation SendNotification {
    input := {
        @required
        message: String

        /// This parameter is optional
        anotherParameter: Foo
    }
}
```

In the above, we've referenced a shape called `Foo` in the output. Let's define that as a `structure`:

```smithy
structure Foo {
    /// Some documentation about this property
    @required
    myProperty: Integer
}
```

When we're happy with our new operation, we must add it to our `service`. By default, the `service` shape is in the `src/main/smithy/main.smithy` file.

```smithy
@websocketJson
service MyApi {
    version: "1.0"
    operations: [
        SendNotification // <- add the new operation here
    ]
}
```

After adding the operation, please follow the remaining instructions in the [main README](../README.md).

## Customising the Smithy Build

The build task for this project will by default generate an Open API specification from the Smithy model, which is then used to generate the runtime, infrastructure, and documentation projects.

You can further customise the build via editing the `TypeSafeWebSocketApiProject` `model.options.smithy.smithyBuildOptions` in the root `.projenrc` file. This includes adding projections, or customising the `openapi` projection used to generate the Open API specification.

For details about customising the build, please refer to the [Smithy Build documentation](https://smithy.io/2.0/guides/building-models/build-config.html).
