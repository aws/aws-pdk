# Interceptors

Interceptors provide a way to share common logic between lambda handlers. They can execute code before and/or after the lambda handler implementation is executed.

## Provided Interceptors

The generated runtime packages include a collection of useful interceptors, and a "default interceptors" array which lambda handler stubs will use by default.

### Powertools for AWS Lambda Interceptors

Logging, Tracing and Metrics interceptors are provided which use Powertools for AWS Lambda. These each initialise a logger, tracer or metrics instance and provide it to your handlers in the `interceptorContext`. You can use the static helper methods provided by each interceptor to extract the instance.

Please refer to the powertools documentation for [typescript](https://docs.powertools.aws.dev/lambda/typescript/latest), [python](https://docs.powertools.aws.dev/lambda/python/latest), and [java](https://docs.powertools.aws.dev/lambda/java) for more details.

### Try Catch Interceptor

Another provided interceptor is the `TryCatchInterceptor` which will catch and log any uncaught exceptions.

## Using and Implementing Interceptors

The lambda handler wrappers allow you to pass in a _chain_ of handler functions to handle the request. This allows you to implement middleware / interceptors for handling requests. Each handler function may choose whether or not to continue the handler chain by invoking `chain.next`.

=== "TS"

    In typescript, interceptors are passed as separate arguments to the generated handler wrapper, in the order in which they should be executed. Call `request.chain.next(request)` from an interceptor to delegate to the rest of the chain to handle a request. Note that the last handler in the chain (ie the actual request handler which transforms the input to the output) should not call `chain.next`.

    An example interceptor might be to record request time metrics. The example below includes the full generic type signature for an interceptor:

    ```ts
    import {
      PayloadlessChainedRequestInput,
    } from "myapi-typescript-runtime";

    // Interceptor to time the handler
    const timingInterceptor = async (
      request: PayloadlessChainedRequestInput,
    ): Promise<void> => {
      const start = Date.now();
      await request.chain.next(request);
      const end = Date.now();
      console.log(`Took ${end - start} ms`);
    };

    // timingInterceptor is passed first, so it runs first and calls the second argument function (the request handler) via chain.next
    export const handler = sayHelloHandler(timingInterceptor, async ({ input }) => {
      // Implement handler here
    });
    ```

    Interceptors may mutate the `interceptorContext` to pass state to further interceptors or the final lambda handler, for example an `identityInterceptor` might want to extract the authenticated user from the request so that it is available in handlers.

    ```ts
    import {
      PayloadlessChainedRequestInput,
    } from "myapi-typescript-runtime";

    const identityInterceptor = async (
      request: PayloadlessChainedRequestInput,
    ): Promise<void> => {
      const authenticatedUser = await getAuthenticatedUser(request.event);
      await request.chain.next({
        ...request,
        interceptorContext: {
          ...request.interceptorContext,
          authenticatedUser,
        },
      });
    };
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.

