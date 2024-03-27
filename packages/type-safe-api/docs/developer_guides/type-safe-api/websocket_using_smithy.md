# Using Smithy

You can use [Smithy](https://smithy.io/2.0), an interface definition language (IDL) to model your APIs. To use Smithy, in `TypeSafeWebSocketApiProject`, specify it as your `model.language`.

=== "TS"

    ```ts
    new TypeSafeWebSocketApiProject({
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: 'com.mycompany',
              serviceName: 'MyApi',
            },
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
                            .smithy(SmithyModelOptions.builder()
                                    .serviceName(SmithyServiceName.builder()
                                            .namespace("com.mycompany")
                                            .serviceName("MyApi")
                                            .build())
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
                smithy=SmithyModelOptions(
                    service_name=SmithyServiceName(
                        namespace="com.amazon",
                        service_name="MyApi"
                    )
                )
            )
        ),
        ...
    )
    ```

## Using the Smithy IDL

For more information on how use Smithy for writing models, refer to the [Smithy documentation](https://smithy.io/2.0/quickstart.html).

```smithy
$version: "2"
namespace example.hello

/// A sample smithy api
@websocketJson
@connectHandler(language: "typescript") // Optional traits for implementing lambda handlers for $connect and $disconnect WebSocket routes
@disconnectHandler(language: "typescript")
service Hello {
    version: "1.0"
    operations: [SayHello]
}

@async(direction: "client_to_server") // Choose from client_to_server, server_to_client or bidirectional
@handler(language: "typescript") // The @handler trait can be specified on client_to_server or bidirectional operations
operation SayHello {
    input := { // Operations only define an input, since they are one-way messages
        @required
        name: String
    }
}

```

## WebSocket traits

### Service Traits

The `@websocketJson` trait must be applied to your service, to indicate it uses the WebSocket protocol.

You can optionally specify `@connectHandler` and `@disconnectHandler` on the service to generate lambda handler stubs for the `$connect` and `$disconnect` routes.

### Operation Traits

The `@async` trait must annotate every operation associated with your service. You must define a `direction` of either `client_to_server`, `server_to_client` or `bidirectional`, indicating whether the client or server should send or receive the message, or both.

The directions are used by Type Safe WebSocket API's code generators to determine what to generate. For example, the Server SDK includes a method for every `server_to_client` and `bidirectional` operation to allow it to send messages to connected clients, but will not include one for `client_to_server` operations as these are not sent from the server.

Like REST APIs, the `@handler` trait can be applied to operations to generate lambda handler stubs for implementing the operation. Since lambda handlers are for messages received by the server, the `@handler` trait may only be applied to `client_to_server` and `bidirectional` operations.

## Differences to standard Smithy

For more details, please refer to the [REST API Using Smithy documentation](./using_smithy.md). Note that authorizers and http-protocol related traits are not applicable to WebSocket APIs. Additionally, using additional projections to generate code directly from Smithy will likely not work, since Smithy does not yet natively support a WebSocket protocol.
