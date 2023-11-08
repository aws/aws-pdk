# Integrations

Integrations define what happens when the API Gateway receives a request for a particular operation.

When you instantiate your generated `Api` construct, you will need to provide an integration for every operation.

=== "TS"

    ```ts
    new Api(this, "Api", {
      integrations: {
        // An integration is required for every operation
        sayHello: {
          integration: Integrations.lambda(...),
        },
      },
    });
    ```

=== "JAVA"

    ```java
    new Api(this, "Api", ApiProps.builder()
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(...))
                            .build())
                    .build())
            .build());
    ```

=== "PYTHON"

    ```python
    Api(self, "Api",
        default_authorizer=cognito_authorizer,
        integrations=OperationConfig(
            # Everyone in the user pool can call this operation:
            say_hello=TypeSafeApiIntegration(
                integration=Integrations.lambda_(...),
            ),
        ),
    )
    ```

## Lambda integration

For integrating an API operation with a lambda, use `Integrations.lambda(yourLambdaFunction)`.

## S3 integration

For integrating an API operation with an S3 bucket, use `Integrations.s3`.

=== "TS"

    ```ts
    Integrations.s3({ bucket: yourS3Bucket });
    ```

=== "Java"

    ```java
    Integrations.s3(S3IntegrationProps.builder()
            .bucket(yourS3Bucket)
            .build());
    ```

=== "Python"

    ```python
    Integrations.s3(bucket=your_s3_bucket)
    ```

!!!note
    By default, this will request an S3 object with the HTTP method and path defined in your API, for example: `GET /pets/{petId}` would perform a `GetObject` for `s3://<yourS3Bucket>/pets/{petId}`, where the path parameter `{petId}` is substituted by the user supplied value.

For more information, for example how the HTTP methods map to S3 operations, refer to the [Tutorial: Create a REST API as an Amazon S3 proxy in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html).

### Customise S3 Operations

You can customise the integration to access objects in S3 at a different key to the API operation path. You can also reference path parameters in the overridden path.

For example, you could have an API operation `POST /pets/{petId}/delete`, but map it to an S3 `DeleteObject` operation for a different object key:

=== "TS"

    ```ts
    Integrations.s3({
        bucket: yourS3Bucket,
        method: "delete",
        path: "my-pets/{petId}/details.json",
    });
    ```

=== "Java"

    ```java
    Integrations.s3(S3IntegrationProps.builder()
            .bucket(yourS3Bucket)
            .method("delete")
            .path("my-pets/{petId}/details.json")
            .build());
    ```

=== "Python"

    ```python
    Integrations.s3(
        bucket=your_s3_bucket,
        method="delete",
        path="my-pets/{petId}/details.json",
    )
    ```

### Customise S3 Integration Responses

By default, if the S3 operation throws an error (for example an object at the requested path does not exist), these will be mapped to a JSON response with a `message` property containing the error message from S3, otherwise the response from S3 will be returned with a `200` status code.

You can customise the responses returned in certain scenarios by utilising an `IntegrationResponseSet`, which can be passed to `Integrations.s3`.

The following predefined integration response sets are available:

- `IntegrationResponseSet.defaultPassthrough()` - all responses are returned with a `200` status code and the response body from S3 is returned
- `IntegrationResponseSet.s3JsonErrorMessage()` - returns the error message from S3 in a JSON response for `400`, `403`, `404` and `500` S3 errors
- `IntegrationResponseSet.catchAll()` - returns a `500` response for any `4XX` or `5XX` error, and the response body from S3 is returned
- `IntegrationResponseSet.custom(...)` - custom responses, mapping S3 HTTP status regexes to the corresponding responses API gateway should return. Refer to [the API Gateway data transformations documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-data-transformations.html) for more details
- `IntegrationResponseSet.composite(...)` - combine integration response sets

!!!note
    If `composite` and `custom` still do not provide enough functionality, you can create your own by extending the `IntegrationResponseSet` class and implementing its `render` method.

The default behaviour described above is defined a combination of `defaultPassthrough` and `s3JsonErrorMessage`, ie:

```ts
IntegrationResponseSet.composite(
    IntegrationResponseSet.defaultPassthrough(),
    IntegrationResponseSet.s3JsonErrorMessage()
)
```

The following example demonstrates how to override the default status code for an S3 DeleteObject operation:

=== "TS"

    ```ts
    Integrations.s3({
        bucket: yourS3Bucket,
        method: "delete",
        path: "my-pets/{petId}/details.json",
        integrationResponseSet: IntegrationResponseSet.composite(
            IntegrationResponseSet.defaultPassthrough({
                statusCode: 204,
            }),
            IntegrationResponseSet.s3JsonErrorMessage()
        ),
    });
    ```

=== "Java"

    ```java
    Integrations.s3(S3IntegrationProps.builder()
            .bucket(yourS3Bucket)
            .method("delete")
            .path("my-pets/{petId}/details.json")
            .integrationResponseSet(IntegrationResponseSet.composite(
                IntegrationResponseSet.defaultPassthrough(DefaultPassthroughIntegrationResponseSetProps.builder()
                    .statusCode(204)
                    .build()),
                IntegrationResponseSet.s3JsonErrorMessage()
            ))
            .build());
    ```

=== "Python"

    ```python
    Integrations.s3(
        bucket=your_s3_bucket,
        method="delete",
        path="my-pets/{petId}/details.json",
        integration_response_set=IntegrationResponseSet.composite(
            IntegrationResponseSet.default_passthrough(status_code=204),
            IntegrationResponseSet.s3_json_error_message()
        )
    )
    ```

!!!warning
    You must make sure that you only respond with status codes which correspond to responses in your model. For example if you do not have a response with a `204` status code defined in your model, you may see an "Internal server error" message returned from API gateway, with a message in the execution logs like "Output mapping refers to an invalid method response: 204"

## Mock integration

To mock an API operation, use the `MockIntegrations` class, which is included in your generated infrastructure package. This contains an integration for every response that can be returned by your operations.

!!! info

    If you need to mock a response not defined in your model, use `Integrations.mock` for a less type-safe alternative.

For more details, refer to the [Mocking Responses developer guide](mocking_responses.md).

## Custom integrations

You can implement your own integrations by extending the `Integration` class and implementing its `render` method. This method is responsible for returning a snippet of OpenAPI which is added as the `x-amazon-apigateway-integration` for an operation.

For more information, refer to the [API Gateway Swagger Extensions documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html).

If you need to use CDK to grant API Gateway access to invoke your integration, you can also optionally override the `grant` method.

For an example of how to create a custom integration for Elastic Container Service (ECS) with a Network Load Balancer, refer to the [Custom Integration Example: ECS and NLB User Guide](../../walkthroughs/type-safe-api/custom_integration_ecs.md).
