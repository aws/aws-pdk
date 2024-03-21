# OpenAPI Model

This project defines the API operations and their inputs and outputs, using [OpenAPI v3](https://swagger.io/specification/v3/).

The entrypoint for the API is `src/main/openapi/main.yaml`. You can add more yaml files (and subfolders) in the `src/main/openapi` directory and these will be included in your API definition so long as they are referencable from `main.yaml`.

Resources:
 - [OpenAPI v3 Documentation](https://swagger.io/specification/v3/)
 - [Type Safe API Documentation](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html)

## Adding Operations

To add an operation, we must edit the `paths` section of the OpenAPI document. We add the desired path and HTTP method for the operation, as well as its inputs and outputs, for example:

```yaml
paths:
  /foo/{myUrlParam}:
    post:
      operationId: CreateFoo
      parameters:
        - name: myUrlParam
          in: path
          schema:
            type: string
          required: true
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateFooRequest'
      responses:
        200:
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreateFooResponse'
```

Notice we used `$ref` to reference `components` in the OpenAPI specification. We define these next:

```yaml
components:
  schemas:
    CreateFooRequest:
      type: object
      properties:
        someParameter:
          type: string
        anotherParameter:
          type: double
      required:
        - someParameter
    CreateFooResponse:
      type: object
      properties:
        foo:
          $ref: '#/components/schemas/Foo'
      required:
        - foo
    Foo:
      type: object
      properties:
        myProperty:
          type: integer
      required:
        - myProperty
```

Notice above we also used a reference to `Foo` in the `CreateFooResponse`

After adding the operation, please follow the remaining instructions in the [main README](../README.md).

## Breaking Up The Model

You may find that a single `main.yaml` file becomes unwieldy as the API grows. You can split the file up using references to local files within the `src/main/openapi` directory.

For example, you might choose to structure your spec as follows:

```
|_ src/main/openapi/
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
  $ref: './paths/index.yaml'
components:
  schemas:
    $ref: './schemas/index.yaml'
```

`paths/index.yaml`:

```yaml
/hello:
  get:
    $ref: './sayHello.yaml'
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
  '200':
    description: Successful response
    content:
      'application/json':
        schema:
          $ref: '../schemas/helloResponse.yaml'
```

`schemas/index.yaml`:

```yaml
HelloResponse:
  $ref: './helloResponse.yaml'
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
