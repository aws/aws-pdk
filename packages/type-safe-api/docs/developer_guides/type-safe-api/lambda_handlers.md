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

This will give you generated lambda handler stubs which look like the following:

=== "TS"

    Notice this defines a `sayHello` method which provides type-safety for your inputs and outputs. You can implement your business logic in there. The lambda handler is wrapped by the `sayHelloHandler` wrapper which manages marshalling and demarshalling, as well as the application of "interceptors".

    Notice the default `INTERCEPTORS` are added to your handler, which provide logging, tracing and metrics from Powertools for AWS Lambda, as well as error handling and adding CORS response headers. For more details about interceptors, refer to the [Interceptors section](./interceptors.md).

    ```ts
    import {
      sayHelloHandler,
      SayHelloChainedHandlerFunction,
      INTERCEPTORS,
      Response,
      LoggingInterceptor,
    } from "myapi-typescript-runtime";

    /**
     * Type-safe handler for the SayHello operation
     */
    export const sayHello: SayHelloChainedHandlerFunction = async (request) => {
      LoggingInterceptor.getLogger(request).info('Start SayHello Operation');

      // TODO: Implement SayHello Operation. `input` contains the request input.
      const { input } = request;

      return Response.internalFailure({
        message: 'Not Implemented!',
      });
    };

    /**
     * Entry point for the AWS Lambda handler for the SayHello operation.
     * The sayHelloHandler method wraps the type-safe handler and manages marshalling inputs and outputs
     */
    export const handler = sayHelloHandler(...INTERCEPTORS, sayHello);
    ```

=== "JAVA"

    Notice this defines a `SayHelloHandler` class which provides type-safety for your inputs and outputs. You can implement your business logic in its `handle` method. This extends the `SayHello` class which manages marshalling and demarshalling, as well as the application of "interceptors".

    Notice `DefaultInterceptors.all()` are used, which provide logging, tracing and metrics from Powertools for AWS Lambda, as well as error handling and adding CORS response headers. For more details about interceptors, refer to the [Interceptors section](./interceptors.md).

    ```java
    package com.generated.api.myapijavahandlers.handlers;

    import com.generated.api.myapijavaruntime.runtime.api.interceptors.DefaultInterceptors;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.Interceptor;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloInput;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHello500Response;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloRequestInput;
    import com.generated.api.myapijavaruntime.runtime.api.handlers.say_hello.SayHelloResponse;
    import com.generated.api.myapijavaruntime.runtime.model.*;
    import org.apache.logging.log4j.LogManager;
    import org.apache.logging.log4j.Logger;

    import java.util.List;

    /**
     * Entry point for the AWS Lambda handler for the SayHello operation.
     * The SayHello class manages marshalling inputs and outputs.
     */
    public class SayHelloHandler extends SayHello {
        /**
         * Interceptors are initialised once during the lambda "init" phase
         */
        private final List<Interceptor<SayHelloInput>> interceptors = DefaultInterceptors.all();

        /**
         * Use the logger to log requests. The LoggingInterceptor sets up all loggers to include lambda context values in your logs.
         */
        private final Logger log = LogManager.getLogger(SayHelloHandler.class);

        /**
         * Return the interceptors for this handler.
         * You can also use the @Interceptors annotation on the class to add interceptors
         */
        @Override
        public List<Interceptor<SayHelloInput>> getInterceptors() {
            return this.interceptors;
        }

        /**
         * This method is executed prior to the Java SnapStart snapshot being taken.
         * Perform any warmup activities to "prime" your function here. Code in this function will be just-in-time compiled,
         * before the snapshot is taken, and thus optimised ready for the first invocation.
         * For example if your function interacts with DynamoDB, perform a simple read operation here.
         * @see https://aws.amazon.com/blogs/compute/reducing-java-cold-starts-on-aws-lambda-functions-with-snapstart/
         */
        @Override
        public void warmUp() {

        }

        /**
         * Type-safe handler for the SayHello operation
         */
        @Override
        public SayHelloResponse handle(final SayHelloRequestInput request) {
            log.info("Start SayHello Operation");

            // TODO: Implement SayHello Operation. `input` contains the request input.
            SayHelloInput input = request.getInput();

            return SayHello500Response.of(InternalFailureErrorResponseContent.builder()
                    .message("Not Implemented!")
                    .build());
        }
    }
    ```

=== "PYTHON"

    Notice this defines a `say_hello` method which provides type-safety for your inputs and outputs. You can implement your business logic in there. The lambda handler is wrapped by the `say_hello_handler` wrapper which manages marshalling and demarshalling, as well as the application of "interceptors". Notice that this is used in non-annotation form, such that `say_hello` can be called directly in your tests, and you can write tests in terms of your modelled inputs and outputs.

    Notice the default `INTERCEPTORS` are added to your handler, which provide logging, tracing and metrics from Powertools for AWS Lambda, as well as error handling and adding CORS response headers. For more details about interceptors, refer to the [Interceptors section](./interceptors.md).

    ```python
    from myapi_python_runtime.models import *
    from myapi_python_runtime.response import Response
    from myapi_python_runtime.interceptors import INTERCEPTORS
    from myapi_python_runtime.interceptors.powertools.logger import LoggingInterceptor
    from myapi_python_runtime.api.operation_config import (
        say_hello_handler, SayHelloRequest, SayHelloOperationResponses
    )


    def say_hello(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
        """
        Type-safe handler for the SayHello operation
        """
        LoggingInterceptor.get_logger(input).info("Start SayHello Operation")

        # TODO: Implement SayHello Operation. `input` contains the request input

        return Response.internal_failure(InternalFailureErrorResponseContent(
            message="Not Implemented!"
        ))


    # Entry point for the AWS Lambda handler for the SayHello operation.
    # The say_hello_handler method wraps the type-safe handler and manages marshalling inputs and outputs
    handler = say_hello_handler(interceptors=INTERCEPTORS)(say_hello)
    ```

!!!note

    If you wish to deviate from the folder structure of the `handlers` projects, or wish to implement your operations in a language not supported by Type Safe API, or through a non-lambda interation (such as a server running in a Fargate container) you can omit the `@handler` trait or `x-handler` vendor extension.

You can implement your lambda handlers in any of the supported languages, or mix and match languages for different operations if you prefer.

An example unit test will also be generated for each handler. These unit tests are only generated when the corresponding handler is initially generated, so you can safely delete the generated test if you do not want it.

## Function CDK Constructs

As well as generating lambda handler stubs, when you use the `@handler` Smithy trait or `x-handler` OpenAPI vendor extension, your generated CDK infrastructure project will include lambda function CDK constructs with preconfigured paths to your handler distributables. This allows you to quickly add lambda integrations to your API:

=== "TS"

    ```ts hl_lines="1 11"
    import { Api, SayHelloFunction } from "myapi-typescript-infra";

    new Api(this, id, {
      defaultAuthorizer: Authorizers.iam(),
      corsOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      integrations: {
        sayHello: {
          integration: Integrations.lambda(new SayHelloFunction(this, "SayHello")),
        },
      },
    });
    ```

=== "JAVA"

    The generated Java functions are configured to enable [SnapStart](https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html) by default.

    ```java hl_lines="3 14"
    import com.generated.api.myapijavainfra.infra.Api;
    import com.generated.api.myapijavainfra.infra.ApiProps;
    import com.generated.api.myapijavainfra.infra.functions.SayHelloFunction;

    new Api(this, id, ApiProps.builder()
            .defaultAuthorizer(Authorizers.iam())
            .corsOptions(CorsOptions.builder()
                    .allowOrigins(Cors.ALL_ORIGINS)
                    .allowMethods(Cors.ALL_METHODS)
                    .build())
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(
                                    new SayHelloFunction(this, "SayHello")))
                            .build())
                    .build())
            .build());
    ```

=== "PYTHON"

    ```python hl_lines="2 12"
    from myapi_python_infra.api import Api
    from myapi_python_infra.functions import SayHelloFunction

    Api(self, id,
       default_authorizer=Authorizers.iam(),
       cors_options=CorsOptions(
           allow_origins=Cors.ALL_ORIGINS,
           allow_methods=Cors.ALL_METHODS
       ),
       integrations=OperationConfig(
           say_hello=TypeSafeApiIntegration(
               integration=Integrations.lambda_(SayHelloFunction(self, 'SayHello')),
           ),
       ),
    )
    ```

!!!warning

    The `<Operation>Function` constructs will point to the implementation in the project corresponding to the `language` you selected in the `@handler` Smithy trait or `x-handler` OpenAPI vendor extension. If you relocate your handler implementation and leave the trait a new handler stub will be generated and the construct will point to that. If you remove the `@handler` Smithy trait or `x-handler` OpenAPI vendor extension from an operation, your generated CDK infrastructure will not include a CDK function construct, and you will need to write your own.
