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

For integrating an API operation with an S3 bucket, use `Integrations.s3(s3IntegrationProps)`.

With:

```ts
s3IntegrationProps = {
    bucket: yourS3Bucket,

    // Optional props

    // A role to grant access to the S3 bucket to API Gateway, a role with required access is created by default
    role: yourS3BucketRole

    // The method to use to interact with the S3 bucket, default to integration method
    method: 'get'

    // The path to use to interact with the S3 bucket, default to integration path
    path: 'example.json'
}
```

For more information, refer to the [Tutorial: Create a REST API as an Amazon S3 proxy in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html).

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
