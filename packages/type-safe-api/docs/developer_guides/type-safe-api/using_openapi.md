# Using OpenAPI

As an alternative to [Smithy](./using_smithy.md) or [TypeSpec](./using_typespec.md), you can use [OpenAPI Version 3.0.3](https://swagger.io/specification/) to define your API.

To use OpenAPI, in `TypeSafeApiProject`, specify it as the `model.language`.

=== "TS"

    ```ts
    new TypeSafeApiProject({
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
    TypeSafeApiProject.Builder.create()
            .name("myapi")
            .model(ModelConfiguration.builder()
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
    TypeSafeApiProject(
        model=ModelConfiguration(
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
paths:
  /hello:
    get:
      operationId: sayHello
      x-handler:
        language: typescript
      parameters:
        - in: query
          name: name
          schema:
            type: string
          required: true
      responses:
        "200":
          description: Successful response
          content:
            "application/json":
              schema:
                $ref: "#/components/schemas/HelloResponse"
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

You can divide your specification into multiple files using `$ref`.

For example, you can structure your spec as follows:

```
|_ model/src/main/openapi/
    |_ main.yaml
    |_ paths/
        |_ index.yaml
        |_ sayHello.yaml
    |_ schemas/
        |_ index.yaml
        |_ helloResponse.yaml
```

where `main.yaml` looks as follows:

```yaml
openapi: 3.0.3
info:
  version: 1.0.0
  title: Example API
paths:
  $ref: "./paths/index.yaml"
components:
  schemas:
    $ref: "./schemas/index.yaml"
```

`paths/index.yaml`:

```yaml
/hello:
  get:
    $ref: "./sayHello.yaml"
```

`paths/sayHello.yaml`:

```yaml
operationId: sayHello
x-handler:
  language: typescript
parameters:
  - in: query
    name: name
    schema:
      type: string
    required: true
responses:
  "200":
    description: Successful response
    content:
      "application/json":
        schema:
          $ref: "../schemas/helloResponse.yaml"
```

`schemas/index.yaml`:

```yaml
HelloResponse:
  $ref: "./helloResponse.yaml"
```

`schemas/helloResponse.yaml`:

```yaml
type: object
properties:
  message:
    type: string
required:
  - message
```
