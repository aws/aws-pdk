# Using OpenAPI

As an alternative to [Smithy](./websocket_using_smithy.md) or [TypeSpec](./websocket_using_typespec.md), you can use [OpenAPI Version 3.0.3](https://swagger.io/specification/) to define your API.

!!!warning

    Note that while Type Safe WebSocket API uses the OpenAPI format to define operations, many of the features of OpenAPI are not supported by WebSockets and therefore may be ignored if you define them in your model, for example specifying `parameters` or `responses`.

    [TypeSpec](./websocket_using_typespec.md) and [Smithy](./websocket_using_smithy.md) are the recommended model languages for WebSocket APIs.

To use OpenAPI, in `TypeSafeWebSocketApiProject`, specify it as the `model.language`.

=== "TS"

    ```ts
    new TypeSafeWebSocketApiProject({
      model: {
        language: ModelLanguage.OPENAPI,
        options: {
          openapi: {
            title: "MyApi"
          },
        },
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    TypeSafeWebSocketApiProject.Builder.create()
            .name("myapi")
            .model(TypeSafeWebSocketApiModelConfiguration.builder()
                    .language(ModelLanguage.OPENAPI)
                    .options(ModelOptions.builder()
                            .openapi(OpenApiModelOptions.builder()
                                    .title("MyApi")
                                    .build())
                    .build())
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeWebSocketApiProject(
        model=TypeSafeWebSocketApiModelConfiguration(
            language=ModelLanguage.OPENAPI,
            options=ModelOptions(
                openapi=OpenApiModelOptions(
                    title="MyApi"
                )
            )
        ),
        ...
    )
    ```

## Using the OpenAPI specification

Your `model/src/main/openapi/main.yaml` file defines your API using [OpenAPI Version 3.0.3](https://swagger.io/specification/). For example,

```yaml
openapi: 3.0.3
info:
  version: 1.0.0
  title: Example API
x-connect-handler: # Use this trait to generate a $connect lambda handler
  language: typescript
x-disconnect-handler: # Use this trait to generate a $disconnect lambda handler
  language: typescript
paths:
  /SayHello: # path is used as the route key, without the / and no path parameters are allowed
    post: # method must be post
      operationId: SayHello
      x-async: # async trait must be specified for every operation
        direction: client_to_server # choose from client_to_server, server_to_client, or bidirectional
      x-handler:
        language: typescript
      requestBody: # the body defines the operation payload
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/SayHelloRequestContent"
      responses: {} # Responses must be empty
components:
  schemas:
    HelloResponse:
      type: object
      properties:
        message:
          type: string
      required:
        - message
```

### Splitting your model definition

Similar to REST APIs, you can split your model into multiple files using `$ref`. See the [REST API documentation](./websocket_using_openapi.md) for more details.
