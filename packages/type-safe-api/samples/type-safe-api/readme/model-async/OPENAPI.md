# OpenAPI Model

This project defines the API operations and their inputs and outputs, using [OpenAPI v3](https://swagger.io/specification/v3/).

The entrypoint for the API is `src/main/openapi/main.yaml`. You can add more yaml files (and subfolders) in the `src/main/openapi` directory and these will be included in your API definition so long as they are referencable from `main.yaml`.

Note that since this defines an asynchronous API, this is not strictly an OpenAPI specification, rather the same syntax can be used if you are familiar with OpenAPI.

Resources:
 - [OpenAPI v3 Documentation](https://swagger.io/specification/v3/)
 - [Type Safe API Documentation](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html)

## Adding Operations

To add an operation, we must edit the `paths` section of the OpenAPI document. The path will be used as the "route" for the asynchronous operation. The method _must_ be `post`. `parameters` are not supported, and likewise responses are not supported

```yaml
paths:
  /SendNotification:
    post:
      x-async:
        direction: server_to_client
      x-handler:
        language: typescript
      operationId: sendNotification
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SendNotificationRequest'
      responses: {}
```

Notice we used `$ref` to reference `components` in the OpenAPI specification. We define these next:

```yaml
components:
  schemas:
    SendNotificationRequest:
      type: object
      properties:
        someParameter:
          type: string
        anotherParameter:
          type: double
      required:
        - someParameter
```

After adding the operation, please follow the remaining instructions in the [main README](../README.md).

## Breaking Up The Model

You may find that a single `main.yaml` file becomes unwieldy as the API grows. You can split the file up using references to local files within the `src/main/openapi` directory.

For example, you might choose to structure your spec as follows:

```
|_ src/main/openapi/
    |_ main.yaml
    |_ paths/
        |_ index.yaml
        |_ sendNotification.yaml
    |_ schemas/
        |_ index.yaml
        |_ sendNotificationRequest.yaml
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
/SendNotification:
  post:
    $ref: './sendNotification.yaml'
```

`paths/sendNotification.yaml`:

```yaml
operationId: sendNotification
requestBody:
  content:
    application/json:
      schema:
        $ref: '../schemas/sendNotificationRequest.yaml'
responses: {}
```

`schemas/index.yaml`:

```yaml
SendNotificationRequest:
  $ref: './sendNotificationRequest.yaml'
```

`schemas/sendNotificationRequest.yaml`:

```yaml
type: object
properties:
  someParameter:
    type: string
  anotherParameter:
    type: double
required:
  - someParameter
```
