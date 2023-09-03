# Lambda Handlers

The generated runtime projects include lambda handler wrappers, which can be used to implement your API operations. These provide input and output type safety, ensuring that your API handlers return outputs that correspond to your model.

For example:

=== "TS"

    ```ts
    import { sayHelloHandler, Response } from "myapi-typescript-runtime";
    
    export const handler = sayHelloHandler(async ({ input }) => {
      return Response.success({
        message: `Hello ${input.requestParameters.name}!`,
      });
    });
    ```

=== "JAVA"

    ```java
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello200Response;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloRequestInput;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloResponse;
    import com.generated.api.myapijavaruntime.runtime.model.SayHelloResponseContent;
    
    
    public class SayHelloHandler extends SayHello {
        @Override
        public SayHelloResponse handle(final SayHelloRequestInput request) {
            return SayHello200Response.of(SayHelloResponseContent.builder()
                    .message(String.format("Hello %s!", request.getInput().getRequestParameters().getName()))
                    .build());
        }
    }
    ```

=== "PYTHON"

    ```python
    from myapi_python_runtime.api.operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
    from myapi_python_runtime.model.api_error import ApiError
    from myapi_python_runtime.model.say_hello_response_content import SayHelloResponseContent
    
    @say_hello_handler
    def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
        return Response.success(
            SayHelloResponseContent(message=f"Hello {input.request_parameters.name}!"),
        )
    ```

## Handler Projects

By configuring `handlers.languages` in your `TypeSafeApiProject` and annotating your operations, you can take advantage of generated handler stubs and generated lambda function CDK constructs to speed up development even further.

=== "SMITHY"

    Use the `@handler` trait, and specify the language you wish to implement this operation in.

    ```smithy hl_lines="3"
    @readonly
    @http(method: "GET", uri: "/hello")
    @handler(language: "typescript")
    operation SayHello {
        input := {
            @httpQuery("name")
            @required
            name: String
        }
        output := {
            @required
            message: String
        }
    }
    ```

=== "OPENAPI"

    Use the `x-handler` vendor extension, specifying the language you wish to implement this operation in.

    ```yaml hl_lines="4-5"
    /hello:
      get:
        operationId: sayHello
        x-handler:
          language: typescript
        parameters:
          - in: query
            name: name
            schema:
              type: string
              required: true
        responses:
          200:
            description: Successful response
            content:
              'application/json':
                schema:
                  $ref: '#/components/schemas/SayHelloResponseContent'
    ```

!!!note

    If you wish to deviate from the folder structure of the `handlers` projects, or wish to implement your operations in a language not supported by Type Safe API, or through a non-lambda interation (such as a server running in a Fargate container) you can omit the `@handler` trait or `x-handler` vendor extension.

You can implement your lambda handlers in any of the supported languages, or mix and match languages for different operations if you prefer.
