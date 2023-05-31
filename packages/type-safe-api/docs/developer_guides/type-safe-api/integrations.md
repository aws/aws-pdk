# Integrations

Integrations define what happens when API Gateway receives a request for a particular operation.

When you instantiate your generated `Api` construct, you'll need to supply an integration for every operation.

For example:

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

## Lambda Integration

For integrating an API operation with a lambda, you can use the `Integrations.lambda(yourLambdaFunction)`.

## Mock Integration

To mock an API operation, you can use the `MockIntegrations` class which you'll find in your generated infrastructure package. This contains an integration for every response that can be returned by your operations. You can also use `Integrations.mock` for a less type-safe alternative if you are using `TypeSafeApi` directly or need to mock a response not defined in your model.

For more details, please see the [Mocking Responses developer guide](mocking_responses.md).

## Custom Integrations

You can implement your own integrations by extending the `Integration` class and implementing its `render` method. This method is responsible for returning a snippet of OpenAPI which will be added as the `x-amazon-apigateway-integration` for an operation. Please refer to the [API Gateway Swagger Extensions documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html) for more details.

You can also optionally override the `grant` method if you need to use CDK to grant API Gateway access to invoke your integration.

Please see the [Custom Integration Example: ECS and NLB User Guide](../../walkthroughs/type-safe-api/custom_integration_ecs.md) for an example of how to create a custom integration for Elastic Container Service with a Network Load Balancer.
