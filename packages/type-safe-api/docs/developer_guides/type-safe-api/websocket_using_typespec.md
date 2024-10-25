# Using TypeSpec

You can use [TypeSpec](https://typespec.io/), an interface definition language (IDL) to model your APIs. To use TypeSpec, in `TypeSafeWebSocketApiProject`, specify it as your `model.language`.

=== "TS"

    ```ts
    new TypeSafeWebSocketApiProject({
      model: {
        language: ModelLanguage.TYPESPEC,
        options: {
          typeSpec: {
            namespace: "MyApi"
          },
        },
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    TypeSafeWebSocketApiProject.Builder.create()
            .model(TypeSafeWebSocketApiModelConfiguration.builder()
                    .language(ModelLanguage.SMITHY)
                    .options(ModelOptions.builder()
                            .typeSpec(TypeSpecModelOptions.builder()
                                    .namespace("MyApi")
                                    .build())
                            .build())
                    .build())
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeWebSocketApiProject(
        model=TypeSafeWebSocketApiModelConfiguration(
            language=ModelLanguage.SMITHY,
            options=ModelOptions(
                type_spec=TypeSpecModelOptions(
                    namespace="MyApi"
                )
            )
        ),
        ...
    )
    ```

## Using the TypeSpec IDL

For more information on how use TypeSpec for writing models, refer to the [TypeSpec documentation](https://typespec.io/docs/getting-started/getting-started-rest/01-setup-basic-syntax/).

You will find your API model in `model/src/main.tsp`:

```tsp
import "@typespec/openapi";
import "@typespec/openapi3";
import "../generated/aws-pdk/prelude.tsp";
import "../generated/aws-pdk/async.tsp";

using OpenAPI;

/**
 * A sample TypeSpec api
 */
@service({
  title: "MyApi",
})
@info({
  version: "1.0",
})
@connectHandler({ language: "typescript" }) // Optional decorators for implementing lambda handlers for $connect and $disconnect WebSocket routes
@disconnectHandler({ language: "typescript" })
namespace MyApi;

@async({ direction: "client_to_server" }) // Choose from client_to_server, server_to_client or bidirectional
@handler({ language: "typescript" }) // The @handler decorator can be specified on client_to_server or bidirectional operations
op SayHello(
    // Operations only define an input, since they are one-way messages
    name: string,
): void;
```

## WebSocket decorators

### Namespace Decorators

You can optionally specify `@connectHandler` and `@disconnectHandler` on your `namespace` in `main.tsp` to generate lambda handler stubs for the `$connect` and `$disconnect` routes.

### Operation Decorators

The `@async` decorator must annotate every operation. You must define a `direction` of either `client_to_server`, `server_to_client` or `bidirectional`, indicating whether the client or server should send or receive the message, or both.

The directions are used by Type Safe WebSocket API's code generators to determine what to generate. For example, the Server SDK includes a method for every `server_to_client` and `bidirectional` operation to allow it to send messages to connected clients, but will not include one for `client_to_server` operations as these are not sent from the server.

Like REST APIs, the `@handler` decorator can be applied to operations to generate lambda handler stubs for implementing the operation. Since lambda handlers are for messages received by the server, the `@handler` decorator may only be applied to `client_to_server` and `bidirectional` operations.
