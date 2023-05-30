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
    Api.Builder.create(this, "Api")
            .integrations(Map.of(
                    "sayHello", Map.of(
                            "integration", Integrations.lambda(...))))
        .build();
    ```

=== "PYTHON"

    ```python
    Api(self, "Api",
        integrations={
            "say_hello": {
                "integration": Integrations.lambda_(...)
            }
        }
    )
    ```

## Lambda Integration

For integrating an API operation with a lambda, you can use the `Integrations.lambda(yourLambdaFunction)`.

## Mock Integration

To mock an API operation, you can use the `MockIntegrations` class which you'll find in your generated infrastructure package. This contains an integration for every response that can be returned by your operations.

For example:

=== "TS"

    ```ts
    import { Api, MockIntegrations } from "myapi-typescript-infra";

    new Api(this, "Api", {
      integrations: {
        sayHello: {
          integration: MockIntegrations.sayHello200({ message: "This is a mocked successful response!" }),
        },
      },
    });
    ```

=== "JAVA"

    ```java
    import myapi.typescript.infra.Api;
    import myapi.typescript.infra.MockIntegrations;
    
    Api.Builder.create(this, "Api")
            .integrations(Map.of(
                    "sayHello", Map.of(
                            "integration", MockIntegrations.sayHello200(Map.of("message", "This is a mocked successful response!")))))
            .build();
    ```

=== "PYTHON"

    ```python
    from myapi_typescript_infra import Api, MockIntegrations

    Api(self, "Api",
        integrations={
            "say_hello": {
                "integration": MockIntegrations.say_hello200(message="This is a mocked successful response!")
            }
        }
    )
    ```

If you're using the `TypeSafeRestApi` construct directly without generated infrastructure, or need to mock a response not defined in your model, you can use `Integrations.mock`. API gateway will respond with the status code and body provided, eg:

=== "TS"

    ```ts
    Integrations.mock({ statusCode: 200, body: JSON.stringify({ message: "hello world!" }) })
    ```

=== "JAVA"

    ```java
    Integrations.mock(Map.of("statusCode", 200, "body", JSON.stringify(Map.of("message", "hello world!"))))
    ```

=== "PYTHON"

    ```python
    Integrations.mock(status_code=200, body=JSON.stringify({"message": "hello world!"}))
    ```

## Custom Integrations

You can implement your own integrations by extending the `Integration` class and implementing its `render` method. This method is responsible for returning a snippet of OpenAPI which will be added as the `x-amazon-apigateway-integration` for an operation. Please refer to the [API Gateway Swagger Extensions documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html) for more details.

You can also optionally override the `grant` method if you need to use CDK to grant API Gateway access to invoke your integration.

Please see the [Custom Integration Example: ECS and NLB User Guide](custom_integration_ecs.md) for an example of how to create a custom integration for Elastic Container Service with a Network Load Balancer.
