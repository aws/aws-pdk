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

### Customise S3 Integrations

You can customise the integration to access objects in S3 at a different key to the API operation path. You can also reference path parameters in the overridden path.

For example, you could have an API operation `POST /pets/{petId}/delete`, but map it to an S3 `DeleteObject` operation for a different object key:

=== "TS"

    ```ts
    Integrations.s3({
        bucket: yourS3Bucket,
        method: "delete",
        path: "my-pets/{petId}/details.json",
        successResponseStatusCode: 204,
    });
    ```

=== "Java"

    ```java
    Integrations.s3(S3IntegrationProps.builder()
            .bucket(yourS3Bucket)
            .method("delete")
            .path("my-pets/{petId}/details.json")
            .successResponseStatusCode(204)
            .build());
    ```

=== "Python"

    ```python
    Integrations.s3(
        bucket=your_s3_bucket,
        method="delete",
        path="my-pets/{petId}/details.json",
        successResponseStatusCode=204
    )
    ```

### Error Behaviour

By default, if the S3 operation throws an error (for example an object at the requested path does not exist), these will be mapped to an empty `500` error response.

You can customise the error behaviour by passing an `errorIntegrationResponse`.

- `ErrorIntegrationResponses.catchAll()` - default behaviour, returns a `500` response for any S3 error
- `ErrorIntegrationResponses.none()` - all failed responses are returned as-is in `200` response (as in successful responses)
- `ErrorIntegrationResponses.custom(...)` - custom error responses, mapping an S3 HTTP status regex to the corresponding response API gateway should return

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
