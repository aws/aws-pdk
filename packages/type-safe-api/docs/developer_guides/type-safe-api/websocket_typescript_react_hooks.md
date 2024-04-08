# TypeScript React WebSocket Hooks

You can generate React hooks for interacting with your API from a React website by adding the following options to your `TypeSafeWebSocketApiProject` in your `.projenrc`:

=== "TS"

    ```ts
    new TypeSafeWebSocketApiProject({
      library: {
        libraries: [WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS],
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    TypeSafeWebSocketApiProject.Builder.create()
            .library(WebSocketLibraryConfiguration.builder()
                    .libraries(Arrays.asList(WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS))
                    .build())
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeWebSocketApiProject(
        library=WebSocketLibraryConfiguration(
            libraries=[WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS]
        )
        ...
    )
    ```

## Usage in a React Website

First, make sure you add a dependency on the generated hooks library. This is done automatically if you pass your `TypeSafeWebSocketApiProject` into the `CloudscapeReactTsWebsite`, eg in your `.projenrc`:

=== "TS"

    ```ts
    const api = new TypeSafeApiProject({ ... });

    new CloudscapeReactTsWebsite({
      ...,
      typeSafeWebSocketApis: [api],
    });
    ```

=== "JAVA"

    ```java
    TypeSafeApiProject api = new TypeSafeWebSocketApiProject(TypeSafeWebSocketApiProjectOptions.builder()
            ...
            .build();

    CloudscapeReactTsWebsite.Builder.create()
            ...
            .typeSafeWebSocketApis(Arrays.asList(api))
            .build();
    ```

=== "PYTHON"

    ```python
    api = TypeSafeWebSocketApiProject(...)

    CloudscapeReactTsWebsite(
        ...
        type_safe_web_socket_apis=[api]
    )
    ```

!!!note

    If you are not using `CloudscapeReactTsWebsite`, you can add the dependency manually using `api.library.typescriptWebSocketHooks!.package.packageName`. You will also need to depend on `api.library.typescriptWebSocketClient`.

Make sure to run `npx projen` to synthesize your `.projenrc` changes.

Next, create an instance of the API client from the `WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT` library in your React Website (making sure to set the url and credentials). See the [WebSocket Clients](./websocket_clients.md) documentation for more details about configuring the client.

Note that if you are using the `CloudscapeReactTsWebsite`, a hook will already be configured for you which manages instantiating the client for IAM (Sigv4) Authentication.

A simple hook to create the client might look as follows:

```ts
import { DefaultApiWebSocketClient } from "myapi-typescript-websocket-client";

export const useWebSocketApiClient = () => {
  // Use a ref to ensure that if the effect is retriggered, we do not create a second connection
  const clientPromiseRef = useRef<Promise<DefaultApiWebSocketClient> | null>(null);
  const [client, setClient] = useState<DefaultApiWebSocketClient>();

  useEffect(() => {
    if (clientPromiseRef.current) {
      return;
    }
    void (async () => {
      clientPromiseRef.current = DefaultApiWebSocketClient.connect(...);
      setClient(await clientPromiseRef.current!);
    })();
  }, [setClient, clientPromiseRef]);

  return client;
};
```

Next, instantiate the client provider above where you would like to use the hooks in your component hierarchy (such as above your router). For example:

```tsx
// NB: client provider may be named differently if you have tagged your operations
import { DefaultApiWebSocketClientProvider } from "myapi-typescript-websocket-hooks";

const client = useWebSocketApiClient();

return client ? (
  <DefaultApiClientProvider client={client}>
    {/* Components within the provider may make use of the hooks */}
  </DefaultApiClientProvider>
) : <Spinner />;
```

Finally, you can import and use your generated hooks. For example:

```tsx
import { useDefaultApiWebSocketClient, useOnSendNotification } from "myapi-typescript-websocket-hooks";

export const MyComponent: FC<MyComponentProps> = () => {
  // The useDefaultApiWebSocketClient hook retrieves the client from the context (reusing the existing connection)
  const client = useDefaultApiWebSocketClient();

  const [notifications, setNotifications] = useState<string[]>([]);

  // The useOn<OperationName> hooks listen for server_to_client or bidirectional messages for the operation
  // Pass the deps array as the second argument just like you would for a useCallback hook.
  useOnSendNotification((input) => {
    setNotifications(prev => [...prev, input.message]);
  }, [setNotifications]);

  return (
    <div>
      {/* Use the client to send messages to the server */}
      <Button onClick={() => client.subscribeToNotifications({ topic: "foo" })}>Send!</Button>
      <ul>
        {notifications.map((notification, i) => (
          <li key={i}>
            {notification}
          </li>
        ))}
      </ul>
    </div>
  )
};
```
