# TypeSpec Model

This project defines the API operations and their inputs and outputs, using an interface definition language called [TypeSpec](https://typespec.io/).

The entrypoint for the API is `src/main.tsp`. You can add more TypeSpec files (and subfolders) in the `src` directory.

Resources:
 - [TypeSpec Documentation](https://typespec.io/)
 - [Type Safe API Documentation](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html)

## Adding Operations

To add an operation, we can use the `op` keyword. It should be annotated with the `@async` decorator which defines the `direction` of an operation (either `server_to_client`, `client_to_server` or `bidirectional`). Each operation must define an input, and must return `void` since websocket messages are one-way. Each operation has its input defined in parentheses.

```tsp
namespace MyApi;

/**
 * This is an example operation.
 */
@async({ direction: "server_to_client" })
op SendNotification(
    message: string,
    anotherParameter?: Foo,
): void;
```

In the above, we've referenced a model called `Foo` in the output. Let's define that as a `model`:

```tsp
model Foo {
    /**
     * Some documentation about this property
     */
    myProperty: int32;
}
```

We can add the operation in its own separate file if we like, or just in `main.tsp`. If in a separate file, __make sure to import the operation in `main.tsp`__, for example:

```tsp
import "./operations/send-notification.tsp";
```

Note that you must use the same `namespace` for all operations defined in your API.

For more details, see the [TypeSpec documentation](https://typespec.io/).
