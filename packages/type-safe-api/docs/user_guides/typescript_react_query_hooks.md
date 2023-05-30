# TypeScript React Query Hooks

You can generate [react-query](https://tanstack.com/query/latest) hooks for interacting with your API from a React website by adding the following options to your `TypeSafeApiProject` in your `.projenrc`:

=== "TS"

    ```ts
    new TypeSafeApiProject({
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    TypeSafeApiProject.Builder.create()
            .library(Map.of(
                    "libraries", List.of(Library.getTYPESCRIPT_REACT_QUERY_HOOKS())))
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeApiProject(
        library={
            "libraries": [Library.TYPESCRIPT_REACT_QUERY_HOOKS]
        },
        ...
    )
    ```

## Usage in a React Website

First, make sure you add a dependency on the generated hooks library, eg in your `.projenrc`:

=== "TS"

    ```ts
    const api = new TypeSafeApiProject({ ... });
    
    new CloudscapeReactTsWebsite({
      ...,
      deps: [
        ...
        api.library.typescriptReactQueryHooks!.package.packageName,
      ],
    });
    ```

=== "JAVA"

    ```java
    TypeSafeApiProject api = TypeSafeApiProject.Builder.create()
            ...
            .build();
    
    CloudscapeReactTsWebsite.Builder.create()
            ...
            .deps(List.of(
                  api.getLibrary().getTypescriptReactQueryHooks().getPackage().getPackageName()))
            .build();
    ```

=== "PYTHON"

    ```python
    api = TypeSafeApiProject(...)
    
    CloudscapeReactTsWebsite(
        ...
        deps=[api.library.typescript_react_query_hooks.package.package_name]
    )
    ```

Make sure to run `projen` (eg. `yarn projen`) to synthesize your `.projenrc` changes!

Next, create an instance of the API client in your React Website (making sure to set the base URL and fetch instance). For example:

```ts
// NB: client may be named differently if you have tagged your operations
import { DefaultApi } from "myapi-typescript-react-query-hooks";

export const useApiClient = () =>
  useMemo(
    () =>
      new DefaultApi(
        new Configuration({
          basePath:
            "https://example123.execute-api.ap-southeast-2.amazonaws.com/prod",
          fetchApi: window.fetch.bind(window),
        })
      ),
    []
  );
```


Note that if you are using the [Cloudscape React Website](../cloudscape-react-ts-website/README.md) with [AWS NorthStar](https://aws.github.io/aws-northstar/) and IAM (Sigv4) Auth for your API, you can use NorthStar's [`useSigv4Client()` hook](https://aws.github.io/aws-northstar/?path=/story/components-cognitoauth-sigv4client-docs--page) to create
an instance of `fetch` which will sign requests with the logged in user's credentials. For example:

```ts
export const useApiClient = () => {
  const client = useSigv4Client();
  return useMemo(
    () =>
      new DefaultApi(
        new Configuration({
          basePath:
            "https://example123.execute-api.ap-southeast-2.amazonaws.com/prod",
          fetchApi: client,
        })
      ),
    [client]
  );
};
```

Next, instantiate the client provider above where you would like to use the hooks in your component hierarchy (such as above your router). For example:

```tsx
// NB: client provider may be named differently if you have tagged your operations
import { DefaultApiClientProvider } from "myapi-typescript-react-query-hooks";

const api = useApiClient();

return (
  <DefaultApiClientProvider apiClient={api}>
    {/* Components within the provider may make use of the hooks */}
  </DefaultApiClientProvider>
);
```

Finally, you can import and use your generated hooks. For example:

```tsx
import { useSayHello } from "myapi-typescript-react-query-hooks";

export const MyComponent: FC<MyComponentProps> = () => {
  const sayHello = useSayHello({ name: "World" });

  return sayHello.isLoading ? (
    <p>Loading...</p>
  ) : sayHello.isError ? (
    <p>Error!</p>
  ) : (
    <h1>{sayHello.data.message}</h1>
  );
};
```

## Paginated Operations

You can generate `useInfiniteQuery` hooks instead of `useQuery` hooks for paginated API operations, by making use of the vendor extension `x-paginated` in your operation in the OpenAPI specification. You must specify both the `inputToken` and `outputToken`, which indicate the properties from the input and output used for pagination. For example in OpenAPI:

```yaml
paths:
  /pets:
    get:
      x-paginated:
        # Input property with the token to request the next page
        inputToken: nextToken
        # Output property with the token to request the next page
        outputToken: nextToken
      parameters:
        - in: query
          name: nextToken
          schema:
            type: string
          required: true
      responses:
        200:
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  nextToken:
                    type: string
```

In Smithy, until [custom vendor extensions can be rendered via traits](https://github.com/awslabs/smithy/pull/1609), you can add the `x-paginated` vendor extension via `smithyBuildOptions` in your `TypeSafeApiProject`, for example:

=== "TS"

    ```ts
    new TypeSafeApiProject({
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: 'com.mycompany',
              serviceName: 'MyApi',
            },
            smithyBuildOptions: {
              projections: {
                openapi: {
                  plugins: {
                    openapi: {
                      jsonAdd: {
                        // Add the x-paginated vendor extension to the GET /pets operation
                        '/paths/~1pets/get/x-paginated': {
                          inputToken: 'nextToken',
                          outputToken: 'nextToken',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    TypeSafeApiProject.Builder.create()
            .model(Map.of(
                    "language", ModelLanguage.getSMITHY(),
                    "options", Map.of(
                            "smithy", Map.of(
                                    "serviceName", Map.of(
                                            "namespace", "com.mycompany",
                                            "serviceName", "MyApi"),
                                    "smithyBuildOptions", Map.of(
                                            "projections", Map.of(
                                                    "openapi", Map.of(
                                                            "plugins", Map.of(
                                                                    "openapi", Map.of(
                                                                            "jsonAdd", Map.of(
                                                                                    // Add the x-paginated vendor extension to the GET /pets operation
                                                                                    "/paths/~1pets/get/x-paginated", Map.of(
                                                                                            "inputToken", "nextToken",
                                                                                            "outputToken", "nextToken")))))))))))
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeApiProject(
        model={
            "language": ModelLanguage.SMITHY,
            "options": {
                "smithy": {
                    "service_name": {
                        "namespace": "com.mycompany",
                        "service_name": "MyApi"
                    },
                    "smithy_build_options": {
                        "projections": {
                            "openapi": {
                                "plugins": {
                                    "openapi": {
                                        "json_add": {
                                            # Add the x-paginated vendor extension to the GET /pets operation
                                            "/paths/~1pets/get/x-paginated": {
                                                "input_token": "nextToken",
                                                "output_token": "nextToken"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        ...
    )
    ```

## Custom QueryClient

If you wish to customise the react-query `QueryClient`, pass a custom instance to the client provider, eg:

```tsx
import { DefaultApiClientProvider } from "myapi-typescript-react-query-hooks";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({ ... });

return (
  <DefaultApiClientProvider apiClient={api} client={queryClient}>
    {/* Components within the provider may make use of the hooks */}
  </DefaultApiClientProvider>
);
```
