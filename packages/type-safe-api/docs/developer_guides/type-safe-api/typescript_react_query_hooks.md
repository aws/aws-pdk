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
            .library(LibraryConfiguration.builder()
                    .libraries(Arrays.asList(Library.TYPESCRIPT_REACT_QUERY_HOOKS))
                    .build())
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeApiProject(
        library=LibraryConfiguration(
            libraries=[Library.TYPESCRIPT_REACT_QUERY_HOOKS]
        )
        ...
    )
    ```

## Usage in a React Website

First, make sure you add a dependency on the generated hooks library. This is done automatically if you pass your `TypeSafeApiProject` into the `CloudscapeReactTsWebsite`, eg in your `.projenrc`:

=== "TS"

    ```ts
    const api = new TypeSafeApiProject({ ... });

    new CloudscapeReactTsWebsite({
      ...,
      typeSafeApi: api,
    });
    ```

=== "JAVA"

    ```java
    TypeSafeApiProject api = new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()
            ...
            .build();

    CloudscapeReactTsWebsite.Builder.create()
            ...
            .typeSafeApi(api)
            .build();
    ```

=== "PYTHON"

    ```python
    api = TypeSafeApiProject(...)

    CloudscapeReactTsWebsite(
        ...
        type_safe_api=api
    )
    ```

!!!note

    If you are not using `CloudscapeReactTsWebsite`, you can add the dependency manually using `api.library.typescriptReactQueryHooks!.package.packageName`

Make sure to run `npx projen` to synthesize your `.projenrc` changes.

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

Note that if you are using the `Cloudscape React Website` with [AWS NorthStar](https://aws.github.io/aws-northstar/) and IAM (Sigv4) Auth for your API, you can use NorthStar's [`useSigv4Client()` hook](https://aws.github.io/aws-northstar/?path=/story/components-cognitoauth-sigv4client-docs--page) to create
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

You can generate `useInfiniteQuery` hooks instead of `useQuery` hooks for paginated API operations by configuring the operation in your model. The configuration requires both an `inputToken` (specifies the input property used to request the next page), and an `outputToken` (specifies the output property in which the pagination token is returned) to be present.

=== "SMITHY"

    In Smithy, annotate your paginated API operations with the `@paginated` trait, making sure both `inputToken` and `outputToken` are specified:

    ```smithy
    @readonly
    @http(method: "GET", uri: "/pets")
    @paginated(inputToken: "nextToken", outputToken: "nextToken", items: "pets") // <- @paginated trait
    operation ListPets {
        input := {
            // Corresponds to inputToken
            @httpQuery("nextToken")
            nextToken: String
        }
        output := {
            @required
            pets: Pets

            // Corresponds to outputToken
            nextToken: String
        }
    }

    list Pets {
        member: Pet
    }
    ```

=== "TYPESPEC"

    In TypeSpec, use the `@extension` decorator to add the `x-paginated` vendor extension.

    ```
    @get
    @route("/pets")
    @extension("x-paginated", { inputToken: "nextToken", outputToken: "nextToken" })
    op ListPets(@query nextToken?: string): {
      pets: Pet[];
      nextToken?: string;
    };`
    ```


=== "OPENAPI"

    In OpenAPI, use the `x-paginaged` vendor extension in your operation, making sure both `inputToken` and `outputToken` are specified:

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
                      pets:
                        $ref: "#/components/schemas/Pets"
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
