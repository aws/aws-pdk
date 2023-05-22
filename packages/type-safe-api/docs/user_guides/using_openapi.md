# Using OpenAPI

As an alternative to [Smithy](./using_smithy.md), you can use [OpenAPI Version 3.0.3](https://swagger.io/specification/) to define your API.

You can achieve this by specifying OpenAPI as the `model.language` in your `TypeSafeApiProject`:

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
            .model(Map.of(
                    "language", ModelLanguage.getOPENAPI(),
                    "options", Map.of(
                            "openapi", Map.of(
                                    "title", "MyApi"))))
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeApiProject(
        model={
            "language": ModelLanguage.OPENAPI,
            "options": {
                "openapi": {
                    "title": "MyApi"
                }
            }
        },
        ...
    )
    ```

## OpenAPI Specification

Your `model/src/main/openapi/main.yaml` file defines your api using [OpenAPI Version 3.0.3](https://swagger.io/specification/). An example spec might look like:

```yaml
openapi: 3.0.3
info:
  version: 1.0.0
  title: Example API
paths:
  /hello:
    get:
      operationId: sayHello
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

You can divide your specification into multiple files using `$ref`.

For example, you might choose to structure your spec as follows:

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

Where `main.yaml` looks as follows:

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
