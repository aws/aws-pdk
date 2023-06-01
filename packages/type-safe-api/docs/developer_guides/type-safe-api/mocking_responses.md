# Mocking Responses

You can stand up a working mocked API prior to implementing it, to allow you or others to work on components which interact with it (for example a website) sooner.

To mock an API operation, you can use the `MockIntegrations` class which you'll find in your generated infrastructure package. This contains an integration for every response that can be returned by your operations.

## Auto-Generated Mock Data

For operations which return JSON structures as responses, you can make use of auto-generated mock responses. 

### Mock All Operations

You can use `MockIntegrations.mockAll` to mock all the operations in your API by returning the first mock response (usually the HTTP 200 response).


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

Note that if you have operations which don't return JSON structures and so can't be mocked automatically, these operations will be omitted from those returned by `MockIntegrations.mockAll` so you will need to specify your own integrations in these cases. You can also use this pattern for gradually replacing mocks with real implementations.


=== "TS"

    ```ts
    import { Integrations } from "@aws-prototyping-sdk/type-safe-api";
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

### Mock Individual Operations

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
