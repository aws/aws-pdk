# Mocking Responses

Before you implement `type-safe-api`, you can set up a working mocked API to allow you or others to work on components which interact with it (for example, a website).

To mock an API operation, use the `MockIntegrations` class which is included in your generated infrastructure package. This contains an integration for every response that can be returned by your operations.

## Auto-generated mock data

For operations which return JSON structures as responses, use the auto-generated mock responses.

### Mock all operations

Use `MockIntegrations.mockAll` to mock all the operations in your API by returning the first mock response (usually the HTTP 200 response).

=== "TS"

    ```ts
    import { Api, MockIntegrations } from "myapi-typescript-infra";

    new Api(this, "Api", {
      integrations: MockIntegrations.mockAll(),
    });
    ```

=== "JAVA"

    ```java
    import com.generated.api.myapijavainfra.infra.Api;
    import com.generated.api.myapijavainfra.infra.ApiProps;
    import com.generated.api.myapijavainfra.infra.MockIntegrations;

    new Api(this, "Api", ApiProps.builder()
            .integrations(MockIntegrations.mockAll().build())
            .build());
    ```

=== "PYTHON"

    ```python
    from myapi_python_infra.api import Api
    from myapi_python_infra.mock_integrations import MockIntegrations

    Api(self, 'Api',
        integrations=MockIntegrations.mock_all(),
    )
    ```

!!! note

    If you have operations which don't return JSON structures and can't be mocked automatically, these operations will be omitted from those returned by `MockIntegrations.mockAll`, so you will need to specify your own integrations in these cases. 
    
    You can also use this pattern for gradually replacing mocks with real implementations.

=== "TS"

    ```ts
    import { Integrations } from "@aws/pdk/type-safe-api";
    import { Api, MockIntegrations } from "myapi-typescript-infra";

    new Api(this, "Api", {
      integrations: {
        ...MockIntegrations.mockAll(),
        sayHello: {
            integration: Integrations.lambda(...),
        },
      },
    });
    ```

=== "JAVA"

    ```java
    import software.aws.awsprototypingsdk.typesafeapi.TypeSafeApiIntegration;
    import software.aws.awsprototypingsdk.typesafeapi.Integrations;

    import com.generated.api.myapijavainfra.infra.Api;
    import com.generated.api.myapijavainfra.infra.ApiProps;
    import com.generated.api.myapijavainfra.infra.MockIntegrations;
    import com.generated.api.myapijavaruntime.runtime.api.OperationConfig;

    new Api(this, "Api", ApiProps.builder()
            .integrations(MockIntegrations.mockAll()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(...))
                            .build()))
                    .build()
            .build());
    ```

=== "PYTHON"

    ```python
    from aws_prototyping_sdk.type_safe_api import Integrations, TypeSafeApiIntegration
    from myapi_python_runtime.apis.tags.default_api_operation_config import OperationConfig
    from myapi_python_infra.api import Api
    from myapi_python_infra.mock_integrations import MockIntegrations

    Api(self, 'Api',
        integrations=MockIntegrations.mock_all(
            say_hello=TypeSafeApiIntegration(
                integration=Integrations.lambda_(...),
            ),
        ),
    )
    ```

### Mock individual operations

For operations which return JSON structures as responses, use the auto-generated mock data by omitting arguments passed to the `MockIntegrations` methods.

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

For operations which return _primitive types_ such as strings, integers or binary responses, you must provide the mock response body.

## Type-Safe custom Mock Responses

To customize the mock responses, pass the response body to the method for the operation response you wish to mock.

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

If you are using the `TypeSafeRestApi` construct directly without generated infrastructure, or need to mock a response not defined in your model, use `Integrations.mock` to mock the raw response to return for the operation. The API gateway will respond with the status code and body provided.

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

## Customising generated Mock data

You can customise the generated mock data by passing `infrastructure.options.<language>.mockDataOptions` to `TypeSafeApiProject`.

You can completely disable mock data generation by setting `infrastructure.options.<language>.mockDataOptions.disable` to `true`.
