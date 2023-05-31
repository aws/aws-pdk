# Mocking Responses

To mock an API operation, you can use the `MockIntegrations` class which you'll find in your generated infrastructure package. This contains an integration for every response that can be returned by your operations.

## Auto-Generated Mock Data

For operations which return JSON structures as responses, you can make use of the auto-generated mock data by omitting arguments passed to the `MockIntegrations` methods, for example:

=== "TS"

    ```ts
    import { Api, MockIntegrations } from "myapi-typescript-infra";

    new Api(this, "Api", {
      integrations: {
        sayHello: {
          integration: MockIntegrations.sayHello200(),
        },
      },
    });
    ```

=== "JAVA"

    ```java
    import com.generated.api.myapijavainfra.infra.Api;
    import com.generated.api.myapijavainfra.infra.ApiProps;
    import com.generated.api.myapijavainfra.infra.MockIntegrations;
    import com.generated.api.myapijavaruntime.runtime.api.OperationConfig;

    new Api(this, "Api", ApiProps.builder()
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(MockIntegrations.sayHello200())
                            .build())
                    .build())
            .build());
    ```

=== "PYTHON"

    ```python
    from myapi_python_runtime.apis.tags.default_api_operation_config import OperationConfig
    from myapi_python_infra.api import Api
    from myapi_python_infra.mock_integrations import MockIntegrations

    Api(self, 'Api',
        integrations=OperationConfig(
            say_hello=TypeSafeApiIntegration(
                integration=MockIntegrations.say_hello_200(),
            ),
        ),
    )
    ```

Note that for operations which return "primitive types" such as strings, integers or binary responses, you must provide the mock response body.

## Type-Safe Custom Mock Responses

If you would like to customise the mock responses, you can pass the response body to the method for the operation response you wish to mock, for example:

=== "TS"

    ```ts
    import { Api, MockIntegrations } from "myapi-typescript-infra";

    new Api(this, "Api", {
      integrations: {
        sayHello: {
          integration: MockIntegrations.sayHello200({
            message: "This is a mocked successful response!",
          }),
        },
      },
    });
    ```

=== "JAVA"

    ```java
    import com.generated.api.myapijavainfra.infra.Api;
    import com.generated.api.myapijavainfra.infra.ApiProps;
    import com.generated.api.myapijavainfra.infra.MockIntegrations;
    import com.generated.api.myapijavaruntime.runtime.api.OperationConfig;
    import com.generated.api.myapijavaruntime.runtime.model.SayHelloResponseContent;

    new Api(this, "Api", ApiProps.builder()
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(MockIntegrations.sayHello200(SayHelloResponseContent.builder()
                                            .message("This is a mocked successful response")
                                    .build()))
                            .build())
                    .build())
            .build());
    ```

=== "PYTHON"

    ```python
    from myapi_python_runtime.apis.tags.default_api_operation_config import OperationConfig
    from myapi_python_infra.api import Api
    from myapi_python_infra.mock_integrations import MockIntegrations

    Api(self, 'Api',
        integrations=OperationConfig(
            say_hello=TypeSafeApiIntegration(
                integration=MockIntegrations.say_hello_200({
                    "message": "This is a mocked successful response!"
                }),
            ),
        ),
    )
    ```

## Raw Response Mocks

If you're using the `TypeSafeRestApi` construct directly without generated infrastructure, or need to mock a response not defined in your model, you can use `Integrations.mock` to mock the raw response to return for the operation. API gateway will respond with the status code and body provided, eg:

=== "TS"

    ```ts
    Integrations.mock({ statusCode: 200, body: JSON.stringify({ message: "hello world!" }) })
    ```

=== "JAVA"

    ```java
    Integrations.mock(MockIntegrationResponse.builder()
            .statusCode(200)
            .body("{\"message\": \"hello world!\"}")
            .build())
    ```

=== "PYTHON"

    ```python
    Integrations.mock(status_code=200, body=json.dumps({"message": "hello world!"}))
    ```

## Customising Generated Mock Data

You can customise the generated mock data by passing `infrastructure.options.<language>.mockDataOptions` to `TypeSafeApiProject`.
