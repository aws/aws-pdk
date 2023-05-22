# Lambda Handlers

The generated runtime projects include lambda handler wrappers, which can be used to implement your API operations. These provide input and output type safety, ensuring that your API handlers return outputs that correspond to your model.

For example:

=== "TS"

    ```ts
    import { sayHelloHandler } from "myapi-typescript-runtime";
    
    export const handler = sayHelloHandler(async ({ input }) => {
      return {
        statusCode: 200,
        body: {
          message: `Hello ${input.requestParameters.name}!`,
        },
      };
    });
    ```

=== "JAVA"

    ```java
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello200Response;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloRequestInput;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHelloResponse;
    import com.generated.api.myapijavaruntime.runtime.model.HelloResponse;
    
    
    public class SayHelloHandler extends SayHello {
        @Override
        public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
            return SayHello200Response.of(HelloResponse.builder()
                    .message(String.format("Hello %s", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                    .build());
        }
    }
    ```

=== "PYTHON"

    ```python
    from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
    from myapi_python_runtime.model.api_error import ApiError
    from myapi_python_runtime.model.hello_response import HelloResponse
    
    @say_hello_handler
    def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
        return ApiResponse(
            status_code=200,
            body=HelloResponse(message="Hello {}!".format(input.request_parameters["name"])),
            headers={}
        )
    ```

## Interceptors

The lambda handler wrappers allow you to pass in a _chain_ of handler functions to handle the request. This allows you to implement middleware / interceptors for handling requests. Each handler function may choose whether or not to continue the handler chain by invoking `chain.next`.

=== "TS"

    In typescript, interceptors are passed as separate arguments to the generated handler wrapper, in the order in which they should be executed. Call `request.chain.next(request)` from an interceptor to delegate to the rest of the chain to handle a request. Note that the last handler in the chain (ie the actual request handler which transforms the input to the output) should not call `chain.next`.
    
    ```ts
    import {
      sayHelloHandler,
      ChainedRequestInput,
      OperationResponse,
    } from "myapi-typescript-runtime";
    
    // Interceptor to wrap invocations in a try/catch, returning a 500 error for any unhandled exceptions.
    const tryCatchInterceptor = async <
      RequestParameters,
      RequestArrayParameters,
      RequestBody,
      Response
    >(
      request: ChainedRequestInput<
        RequestParameters,
        RequestArrayParameters,
        RequestBody,
        Response
      >
    ): Promise<Response | OperationResponse<500, { errorMessage: string }>> => {
      try {
        return await request.chain.next(request);
      } catch (e: any) {
        return { statusCode: 500, body: { errorMessage: e.message } };
      }
    };
    
    // tryCatchInterceptor is passed first, so it runs first and calls the second argument function (the request handler) via chain.next
    export const handler = sayHelloHandler(
      tryCatchInterceptor,
      async ({ input }) => {
        return {
          statusCode: 200,
          body: {
            message: `Hello ${input.requestParameters.name}!`,
          },
        };
      }
    );
    ```
    
    Another example interceptor might be to record request time metrics. The example below includes the full generic type signature for an interceptor:
    
    ```ts
    import { ChainedRequestInput } from "myapi-typescript-runtime";
    
    const timingInterceptor = async <
      RequestParameters,
      RequestArrayParameters,
      RequestBody,
      Response
    >(
      request: ChainedRequestInput<
        RequestParameters,
        RequestArrayParameters,
        RequestBody,
        Response
      >
    ): Promise<Response> => {
      const start = Date.now();
      const response = await request.chain.next(request);
      const end = Date.now();
      console.log(`Took ${end - start} ms`);
      return response;
    };
    ```
    
    Interceptors may mutate the `interceptorContext` to pass state to further interceptors or the final lambda handler, for example an `identityInterceptor` might want to extract the authenticated user from the request so that it is available in handlers.
    
    ```ts
    import {
      LambdaRequestParameters,
      LambdaHandlerChain,
    } from "myapi-typescript-runtime";
    
    const identityInterceptor = async <
      RequestParameters,
      RequestArrayParameters,
      RequestBody,
      Response
    >(
      request: ChainedRequestInput<
        RequestParameters,
        RequestArrayParameters,
        RequestBody,
        Response
      >
    ): Promise<Response> => {
      const authenticatedUser = await getAuthenticatedUser(request.event);
      return await request.chain.next({
        ...request,
        interceptorContext: {
          ...request.interceptorContext,
          authenticatedUser,
        },
      });
    };
    ```

=== "JAVA"

    In Java, interceptors can be added to a handler via the `@Interceptors` class annotation:

    ```java
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Interceptors;
    
    @Interceptors({ TimingInterceptor.class, TryCatchInterceptor.class })
    public class SayHelloHandler extends SayHello {
        @Override
        public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
            return SayHello200Response.of(HelloResponse.builder()
                    .message(String.format("Hello %s", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                    .build());
        }
    }
    ```
    
    To write an interceptor, you can implement the `Interceptor` interface. For example, a timing interceptor:
    
    ```java
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Interceptor;
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.ChainedRequestInput;
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Response;
    
    public class TimingInterceptor<Input> implements Interceptor<Input> {
        @Override
        public Response handle(ChainedRequestInput<Input> input) {
            long start = System.currentTimeMillis();
            Response res = input.getChain().next(input);
            long end = System.currentTimeMillis();
            System.out.printf("Took %d ms%n", end - start);
            return res;
        }
    }
    ```
    
    Interceptors may choose to return different responses, for example to return a 500 response for any unhandled exceptions:
    
    ```java
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Interceptor;
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.ChainedRequestInput;
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.Response;
    import com.generated.api.myjavaapiruntime.runtime.api.Handlers.ApiResponse;
    import com.generated.api.myjavaapiruntime.runtime.model.ApiError;
    
    public class TryCatchInterceptor<Input> implements Interceptor<Input> {
        @Override
        public Response handle(ChainedRequestInput<Input> input) {
            try {
                return input.getChain().next(input);
            } catch (Exception e) {
                return ApiResponse.builder()
                        .statusCode(500)
                        .body(ApiError.builder()
                                .errorMessage(e.getMessage())
                                .build().toJson())
                        .build();
            }
        }
    }
    ```
    
    Interceptors are permitted to mutate the "interceptor context", which is a `Map<String, Object>`. Each interceptor in the chain, and the final handler, can access this context:
    
    ```java
    public class IdentityInterceptor<Input> implements Interceptor<Input> {
        @Override
        public Response handle(ChainedRequestInput<Input> input) {
            input.getInterceptorContext().put("AuthenticatedUser", this.getAuthenticatedUser(input.getEvent()));
            return input.getChain().next(input);
        }
    }
    ```
    
    Interceptors can also mutate the response returned by the handler chain. An example use case might be adding cross-origin resource sharing headers:
    
    ```java
    public static class AddCorsHeadersInterceptor<Input> implements Interceptor<Input> {
        @Override
        public Response handle(ChainedRequestInput<Input> input) {
            Response res = input.getChain().next(input);
            res.getHeaders().put("Access-Control-Allow-Origin", "*");
            res.getHeaders().put("Access-Control-Allow-Headers", "*");
            return res;
        }
    }
    ```
    
    Interceptors referenced by the `@Interceptors` annotation must be constructable with no arguments. If more complex instantiation of your interceptor is required (for example if you are using dependency injection or wish to pass configuration to your interceptor), you may instead override the `getInterceptors` method in your handler:
    
    ```java
    public class SayHelloHandler extends SayHello {
        @Override
        public List<Interceptor<SayHelloInput>> getInterceptors() {
            return Arrays.asList(
                    new MyConfiguredInterceptor<>(42),
                    new MyOtherConfiguredInterceptor<>("configuration"));
        }
    
        @Override
        public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
            return SayHello200Response.of(HelloResponse.builder()
                    .message(String.format("Hello %s!", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                    .build());
        }
    }
    ```

=== "PYTHON"

    In Python, a list of interceptors can be passed as a keyword argument to the generated lambda handler decorator, for example:
    
    ```python
    from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
    from myapi_python_runtime.model.api_error import ApiError
    from myapi_python_runtime.model.hello_response import HelloResponse
    
    @say_hello_handler(interceptors=[timing_interceptor, try_catch_interceptor])
    def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
        return ApiResponse(
            status_code=200,
            body=HelloResponse(message="Hello {}!".format(input.request_parameters["name"])),
            headers={}
        )
    ```
    
    Writing an interceptor is just like writing a lambda handler. Call `chain.next(input)` from an interceptor to delegate to the rest of the chain to handle a request.
    
    ```python
    import time
    from myapi_python_runtime.apis.tags.default_api_operation_config import ChainedApiRequest, ApiResponse
    
    def timing_interceptor(input: ChainedApiRequest) -> ApiResponse:
        start = int(round(time.time() * 1000))
        response = input.chain.next(input)
        end = int(round(time.time() * 1000))
        print("Took {} ms".format(end - start))
        return response
    ```
    
    Interceptors may choose to return different responses, for example to return a 500 response for any unhandled exceptions:
    
    ```python
    import time
    from myapi_python_runtime.model.api_error import ApiError
    from myapi_python_runtime.apis.tags.default_api_operation_config import ChainedApiRequest, ApiResponse
    
    def try_catch_interceptor(input: ChainedApiRequest) -> ApiResponse:
        try:
            return input.chain.next(input)
        except Exception as e:
            return ApiResponse(
                status_code=500,
                body=ApiError(errorMessage=str(e)),
                headers={}
            )
    ```
    
    Interceptors are permitted to mutate the "interceptor context", which is a `Dict[str, Any]`. Each interceptor in the chain, and the final handler, can access this context:
    
    ```python
    def identity_interceptor(input: ChainedApiRequest) -> ApiResponse:
        input.interceptor_context["AuthenticatedUser"] = get_authenticated_user(input.event)
        return input.chain.next(input)
    ```
    
    Interceptors can also mutate the response returned by the handler chain. An example use case might be adding cross-origin resource sharing headers:
    
    ```python
    def add_cors_headers_interceptor(input: ChainedApiRequest) -> ApiResponse:
        response = input.chain.next(input)
        return ApiResponse(
            status_code=response.status_code,
            body=response.body,
            headers={
                **response.headers,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )
    ```

## Handler Router

The lambda handler wrappers can be used in isolation as handlers for separate lambda functions. If you would like to use a single lambda function to serve all requests, you can wrap your individual handlers with a "handler router", for example:

=== "TS"

    ```ts
    import {
      handlerRouter,
      sayHelloHandler,
      sayGoodbyeHandler,
    } from "myapi-typescript-runtime";
    import { corsInterceptor } from "./interceptors";
    import { sayGoodbye } from "./handlers/say-goodbye";
    
    const sayHello = sayHelloHandler(async ({ input }) => {
      return {
        statusCode: 200,
        body: {
          message: `Hello ${input.requestParameters.name}!`,
        },
      };
    });
    
    export const handler = handlerRouter({
      // Interceptors declared in this list will apply to all operations
      interceptors: [corsInterceptor],
      // Assign handlers to each operation here
      handlers: {
        sayHello,
        sayGoodbye,
      },
    });
    ```

=== "JAVA"

    ```java
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayGoodbye;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.HandlerRouter;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.Interceptors;
    import com.generated.api.myapijavaruntime.runtime.api.Handlers.SayHello;
    
    import java.util.Arrays;
    import java.util.List;
    
    // Interceptors defined here apply to all operations
    @Interceptors({ TimingInterceptor.class })
    public class ApiHandlerRouter extends HandlerRouter {
        // You must implement a method to return a handler for every operation
        @Override
        public SayHello sayHello() {
            return new SayHelloHandler();
        }
    
        @Override
        public SayGoodbye sayGoodbye() {
            return new SayGoodbyeHandler();
        }
    }
    ```

=== "PYTHON"

    ```python
    from myapi_python_runtime.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses, handler_router, HandlerRouterHandlers
    from myapi_python_runtime.model.api_error import ApiError
    from myapi_python_runtime.model.hello_response import HelloResponse
    from other_handlers import say_goodbye
    from my_interceptors import cors_interceptor
    
    @say_hello_handler
    def say_hello(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
        return ApiResponse(
            status_code=200,
            body=HelloResponse(message="Hello {}!".format(input.request_parameters["name"])),
            headers={}
        )
    
    handler = handler_router(
        # Interceptors defined here will apply to all operations
        interceptors=[cors_interceptor],
        handlers=HandlerRouterHandlers(
              say_hello=say_hello,
              say_goodbye=say_goodbye
        )
    )
    ```

When you use a handler router, you must specify the same lambda function for every integration in your `Api` CDK construct. To save typing, you can use the `Operations.all` method from your generated runtime package:

=== "TS"

    ```ts
    import { Operations } from "myapi-typescript-runtime";
    import { Authorizers, Integrations } from "@aws-prototyping-sdk/type-safe-api";
    import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
    import { Construct } from "constructs";
    import { Api } from "myapi-typescript-infra";
    
    export class SampleApi extends Api {
      constructor(scope: Construct, id: string) {
        super(scope, id, {
          defaultAuthorizer: Authorizers.iam(),
          // Use the same integration for every operation.
          integrations: Operations.all({
            integration: Integrations.lambda(new NodejsFunction(scope, "router")),
          }),
        });
      }
    }
    ```

=== "JAVA"

    ```java
    import myapi.typescript.runtime.Operations;
    import aws.prototyping.sdk.type.safe.api.Authorizers;
    import aws.prototyping.sdk.type.safe.api.Integrations;
    import software.amazon.awscdk.services.lambda.nodejs.NodejsFunction;
    import software.constructs.Construct;
    import myapi.typescript.infra.Api;
    
    public class SampleApi extends Api {
        public SampleApi(Construct scope, String id) {
            super(scope, id, Map.of(
                    "defaultAuthorizer", Authorizers.iam(),
                    // Use the same integration for every operation.
                    "integrations", Operations.all(Map.of(
                            "integration", Integrations.lambda(new NodejsFunction(scope, "router"))))));
        }
    }
    ```

=== "PYTHON"

    ```python
    from myapi_typescript_runtime import Operations
    from aws_prototyping_sdk.type_safe_api import Authorizers, Integrations
    from aws_cdk.aws_lambda_nodejs import NodejsFunction
    from constructs import Construct
    from myapi_typescript_infra import Api
    
    class SampleApi(Api):
        def __init__(self, scope, id):
            super().__init__(scope, id,
                default_authorizer=Authorizers.iam(),
                # Use the same integration for every operation.
                integrations=Operations.all(
                    integration=Integrations.lambda_(NodejsFunction(scope, "router"))
                )
            )
    ```
