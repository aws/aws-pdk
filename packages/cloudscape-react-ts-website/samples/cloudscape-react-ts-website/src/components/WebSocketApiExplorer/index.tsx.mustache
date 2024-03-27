import { Sha256 } from "@aws-crypto/sha256-js";
import { useCognitoAuthContext } from "@aws-northstar/ui";
import getCredentials from "@aws-northstar/ui/components/CognitoAuth/hooks/useSigv4Client/utils/getCredentials";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import {
  AppLayoutProps,
  Badge,
  Button,
  ExpandableSection,
  Form,
  FormField,
  Header,
  SpaceBetween,
  Spinner,
  SplitPanel,
  Table,
  TextContent,
  TextFilter,
  Textarea,
} from "@cloudscape-design/components";
import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import SwaggerUI from "swagger-ui-react";
import { v4 as uuid } from "uuid";
import { AppLayoutContext } from "../../layouts/App";
import "./style.css";

export interface WebSocketExplorerProps {
  readonly selectedApi: string;
  readonly spec: any;
}

export const WebSocketExplorer: FC<WebSocketExplorerProps> = ({
  spec,
  selectedApi,
}) => {
  const inlinedRefSpec = useMemo(() => {
    return resolveAllRefs(spec);
  }, [spec]);

  const client = useGenericWebSocketClient(spec.url);
  return client ? (
    <ConnectedWebSocketExplorer
      client={client}
      spec={inlinedRefSpec}
      selectedApi={selectedApi}
    />
  ) : (
    <Spinner size="large" />
  );
};

export interface ConnectedWebSocketExplorerProps
  extends WebSocketExplorerProps {
  readonly client: GenericWebSocketClient;
}

enum MessageDirection {
  CLIENT_TO_SERVER = "CLIENT_TO_SERVER",
  SERVER_TO_CLIENT = "SERVER_TO_CLIENT",
}

interface EventLogItem {
  readonly direction: MessageDirection;
  readonly isError?: boolean;
  readonly route: string;
  readonly timestamp: Date;
  readonly payload: string;
}

const ConnectedWebSocketExplorer: FC<ConnectedWebSocketExplorerProps> = ({
  client,
  spec,
}) => {
  const clientToServerOps = useMemo(() => {
    const ops: { [routeKey: string]: any } = {};
    Object.entries(spec.paths).forEach(([path, methods]) => {
      const routeKey = path.replace(/\//g, "");
      const method = Object.values(methods as any)[0] as any;
      if (
        ["client_to_server", "bidirectional"].includes(
          method?.["x-async"]?.direction,
        )
      ) {
        ops[routeKey] = method;
      }
    });
    return ops;
  }, [spec]);

  const [eventLog, setEventLog] = useState<EventLogItem[]>([]);

  const onMessage = useCallback(
    (route: string, payload?: any) => {
      let payloadJson = typeof payload === "string" ? payload : "";
      try {
        payloadJson = JSON.stringify(payload, null, 2);
      } catch {}
      setEventLog((prev) => [
        ...prev,
        {
          route,
          timestamp: new Date(),
          payload: payloadJson,
          direction: MessageDirection.SERVER_TO_CLIENT,
        },
      ]);
    },
    [setEventLog],
  );

  const onError = useCallback(
    (error: WebSocketError) => {
      setEventLog((prev) => [
        ...prev,
        {
          isError: true,
          route: "Error",
          timestamp: new Date(),
          payload: error.message,
          direction: MessageDirection.SERVER_TO_CLIENT,
        },
      ]);
    },
    [setEventLog],
  );

  useEffect(() => {
    return client.$onAnyMessage(onMessage);
  }, [onMessage, client]);

  useEffect(() => {
    return client.$onError(onError);
  }, [onError, client]);

  const send = useCallback(
    (routeKey: string, payload?: any) => {
      void client.$send(routeKey, payload);
      let payloadJson = typeof payload === "string" ? payload : "";
      try {
        payloadJson = JSON.stringify(payload, null, 2);
      } catch {}
      setEventLog((prev) => [
        ...prev,
        {
          route: routeKey,
          timestamp: new Date(),
          payload: payloadJson,
          direction: MessageDirection.CLIENT_TO_SERVER,
        },
      ]);
    },
    [client, setEventLog],
  );

  const [panelOpen, setPanelOpen] = useState(true);
  const [preferences, setPreferences] =
    useState<AppLayoutProps.SplitPanelPreferences>({
      position: "bottom",
    });

  const [filterText, setFilterText] = useState("");

  const { setAppLayoutProps, appLayoutProps } = useContext(AppLayoutContext);
  useEffect(() => {
    setAppLayoutProps({
      splitPanelOpen: panelOpen,
      onSplitPanelToggle: (e) => setPanelOpen(e.detail.open),
      splitPanelPreferences: preferences,
      onSplitPanelPreferencesChange: (e) => setPreferences(e.detail),
      splitPanel: (
        <SplitPanel header="Message Log">
          <Table
            filter={
              <TextFilter
                filteringText={filterText}
                onChange={(e) => setFilterText(e.detail.filteringText)}
              />
            }
            header={
              <Header
                actions={
                  <Button
                    variant="icon"
                    iconName="remove"
                    onClick={() => setEventLog([])}
                  ></Button>
                }
              >
                Messages
              </Header>
            }
            variant="embedded"
            columnDefinitions={[
              {
                header: "Timestamp",
                cell: (item) => item.timestamp.toISOString(),
              },
              {
                header: "Operation",
                cell: (item) => (
                  <Badge
                    color={
                      item.isError
                        ? "red"
                        : item.direction === MessageDirection.SERVER_TO_CLIENT
                          ? "blue"
                          : "grey"
                    }
                  >
                    {item.route}
                  </Badge>
                ),
              },
              {
                header: "Payload",
                cell: (item) => (
                  <TextContent>
                    <code>{item.payload}</code>
                  </TextContent>
                ),
              },
            ]}
            items={[...eventLog]
              .filter(
                (item) =>
                  item.timestamp.toISOString().includes(filterText) ||
                  item.payload.includes(filterText) ||
                  item.route.includes(filterText),
              )
              .reverse()}
          />
        </SplitPanel>
      ),
    });
  }, [
    appLayoutProps,
    setAppLayoutProps,
    eventLog,
    panelOpen,
    setPanelOpen,
    preferences,
    setPreferences,
    filterText,
    setFilterText,
  ]);

  useEffect(() => {
    return () => setAppLayoutProps({});
  }, []);

  return (
    <SpaceBetween size="l">
      {Object.entries(clientToServerOps).map(([routeKey, op]) => (
        <ClientToServerOperation
          key={routeKey}
          routeKey={routeKey}
          op={op}
          send={send}
        />
      ))}
    </SpaceBetween>
  );
};

export interface ClientToServerOperationProps {
  readonly routeKey: string;
  readonly send: (routeKey: string, payload?: any) => void;
  readonly op: any;
}

export const ClientToServerOperation: FC<ClientToServerOperationProps> = ({
  routeKey,
  send,
  op,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState<string>(getSample(op)); // TODO: start with sample data matching op request body

  const jsonValue = useMemo(() => {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }, [value]);

  return (
    <ExpandableSection
      variant="container"
      expanded={expanded}
      onChange={(e) => setExpanded(e.detail.expanded)}
      headerActions={
        expanded ? (
          <Button
            variant="primary"
            disabled={!jsonValue}
            onClick={() => send(routeKey, jsonValue)}
          >
            Send
          </Button>
        ) : null
      }
      headerText={routeKey}
    >
      {op.description ? <TextContent>{op.description}</TextContent> : null}
      <Form>
        <FormField
          errorText={!jsonValue ? "Payload is not valid json" : undefined}
        >
          <div className="websocket-api-explorer-input">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.detail.value)}
              rows={Math.min(
                Math.max((value?.split("\n") ?? []).length, 3),
                25,
              )}
            />
          </div>
        </FormField>
      </Form>
    </ExpandableSection>
  );
};

const getSample = (op: any): string => {
  const schema = op.requestBody?.content?.["application/json"]?.schema;
  if (!schema) {
    return "{}";
  }
  const sample = (
    SwaggerUI as any
  ).plugins?.CorePluginsSamplesFnIndex?.memoizedSampleFromSchema?.(schema);
  return JSON.stringify(sample ?? {}, null, 2);
};

const _get = (object: any | undefined, paths: string[]): any => {
  if (typeof object === "undefined") {
    return undefined;
  }
  if (paths.length === 0) {
    return object;
  }
  return _get(object[paths[0]], paths.slice(1));
};

/**
 * Split a reference into its component parts
 * eg: #/components/schemas/Foo -> ["components", "schemas", "Foo"]
 */
const splitRef = (ref: string): string[] =>
  ref
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~0/g, "~").replace(/~1/g, "/"));

/**
 * Resolve the given reference in the spec
 */
const resolveRef = (spec: any, ref: string): any => {
  const refParts = splitRef(ref);
  const resolved = _get(spec, refParts);
  if (!resolved) {
    throw new Error(`Unable to resolve ref ${ref} in spec`);
  }
  return resolved;
};

const MAX_DEPTH = 20;

const resolveAllRefs = (spec: any) => {
  const resolutions: { [key: string]: number } = {};
  return JSON.parse(
    JSON.stringify(spec, (k, v: any) => {
      if (typeof v === "object" && v?.$ref) {
        const resolutionKey = `${k}:${v.$ref}`;
        if (resolutions[resolutionKey] === undefined) {
          resolutions[resolutionKey] = 0;
        }
        if (++resolutions[resolutionKey] >= MAX_DEPTH) {
          return v;
        }
        return structuredClone(resolveRef(spec, v.$ref));
      }
      return v;
    }),
  );
};

const useGenericWebSocketClient = (url: string) => {
  const { getAuthenticatedUser, region, identityPoolId, userPoolId } =
    useCognitoAuthContext();

  const [client, setClient] = useState<GenericWebSocketClient>();

  useEffect(() => {
    if (
      !region ||
      !getAuthenticatedUser ||
      !getAuthenticatedUser() ||
      client ||
      !url
    ) {
      return;
    }
    void (async () => {
      setClient(
        await GenericWebSocketClient.connect({
          url,
          authentication: {
            iam: {
              region,
              credentials: () =>
                getCredentials(
                  getAuthenticatedUser()!,
                  region,
                  identityPoolId,
                  userPoolId,
                ),
            },
          },
        }),
      );
    })();
  }, [region, getAuthenticatedUser, setClient, client, url]);

  return client;
};

/**
 * Options for the client
 */
export interface GenericWebSocketClientOptions {
  /**
   * Websocket url to connect to (wss://xxxx)
   */
  readonly url: string;

  readonly authentication: { iam: IamAuthenticationStrategy };
}

interface IamAuthenticationStrategy {
  credentials: any;
  region: string;
}

enum SocketStatus {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
}

interface QueuedMessage {
  readonly message: string;
  readonly resolve: () => void;
  readonly reject: () => void;
}

interface AllMessagesListener {
  readonly id: string;
  readonly listener: (route: string, payload?: any) => void;
}

export interface WebSocketError {
  readonly message: string;
}

interface ErrorListener {
  readonly id: string;
  readonly listener: (error: WebSocketError) => void;
}

/**
 * Generic websocket client for interacting with any api
 * Please use the type-safe one from your generated client library!
 */
class GenericWebSocketClient {
  /**
   * Create a new WebSocket connection to the server
   */
  public static connect = async (options: GenericWebSocketClientOptions) => {
    const client = new GenericWebSocketClient(options);
    await client.$connect();
    return client;
  };

  private readonly options: GenericWebSocketClientOptions;

  private socket: WebSocket | undefined;
  private status: SocketStatus = SocketStatus.CONNECTING;
  private readonly messageQueue: QueuedMessage[] = [];
  private allMessageListeners: AllMessagesListener[] = [];
  private errorListeners: ErrorListener[] = [];
  private connectionAttempt: number = 0;
  private lastConnected: number = Date.now();

  private constructor(options: GenericWebSocketClientOptions) {
    this.options = options;
  }

  private _signConnectionUrl = async (iam: IamAuthenticationStrategy) => {
    const url = new URL(this.options.url);

    const request = new HttpRequest({
      hostname: url.hostname,
      method: "GET",
      path: url.pathname,
      protocol: url.protocol,
      headers: {
        host: url.hostname,
      },
      query: Object.fromEntries((url.searchParams ?? {}) as any),
    });

    const sigv4 = new SignatureV4({
      credentials: iam.credentials,
      service: "execute-api",
      region: iam.region,
      sha256: Sha256,
    });

    const signedRequest = await sigv4.presign(request);

    Object.keys(signedRequest.query ?? {}).forEach((param) => {
      const value = (signedRequest.query ?? {})[param];
      if (value) {
        url.searchParams.set(param, value as any);
      }
    });

    return url.toString();
  };

  private _sleep = async (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  private _onClose = async () => {
    this.socket!.onclose = null;
    this.socket!.onmessage = null;
    this.socket!.onerror = null;

    // After 10 seconds, reset the number of retries so stale connections are always refreshed
    if (Date.now() - this.lastConnected > 10000) {
      this.connectionAttempt = 0;
    }

    if (this.connectionAttempt >= 3) {
      this._onDisconnect();
      const message = "Connection failed after maximum number of retries";
      this.errorListeners.forEach(({ listener }) => listener({ message }));
      throw new Error(message);
    }

    this.connectionAttempt++;

    await this._sleep(2 ** this.connectionAttempt * 10);

    await this._connect();
  };

  private _onMessage = async (event: any) => {
    if (typeof event.data !== "string" || !event.data) {
      return;
    }

    try {
      const data = JSON.parse(event.data);

      if ("message" in data && typeof data.message === "string") {
        this.errorListeners.forEach(({ listener }) =>
          listener({ message: data.message }),
        );
      } else if ("route" in data) {
        this.allMessageListeners.forEach(({ listener }) =>
          listener(data.route, data.payload),
        );
      } else {
        this.errorListeners.forEach(({ listener }) =>
          listener({ message: `Unexpected data received ${event.data}` }),
        );
      }
    } catch (e: any) {
      this.errorListeners.forEach(({ listener }) =>
        listener({ message: `Failed to parse received data ${event.data}` }),
      );
    }
  };

  private _onError = async (error: any) => {
    this.errorListeners.forEach(({ listener }) =>
      listener({ message: error.message }),
    );
  };

  private _sendOrQueueMessage = (
    route: string,
    payload?: any,
  ): Promise<void> => {
    const message = JSON.stringify({ route, payload });
    if (this.status === SocketStatus.CONNECTED) {
      this._send(message);
      return Promise.resolve();
    } else if (this.status === SocketStatus.DISCONNECTED) {
      return Promise.reject(
        new Error(
          "The socket is not connected. Please call $connect before sending messages",
        ),
      );
    }
    // Status is CONNECTING, queue the message
    return new Promise((resolve, reject) => {
      this.messageQueue.push({ message, resolve, reject });
    });
  };

  private _flushMessageQueue = () => {
    while (this.messageQueue.length > 0) {
      const { message, resolve } = this.messageQueue.shift()!;
      this._send(message);
      resolve();
    }
  };

  private _rejectMessageQueue = () => {
    while (this.messageQueue.length > 0) {
      const { reject } = this.messageQueue.shift()!;
      reject();
    }
  };

  private _send = (message: string) => {
    this.socket!.send(message);
  };

  private _connect = async (): Promise<void> => {
    this.status = SocketStatus.CONNECTING;
    const url = await this._signConnectionUrl(this.options.authentication.iam);

    // Create the socket and wait for it to open (or immediately close)
    this.socket = new WebSocket(url);
    await (() => {
      return new Promise<void>((resolve, reject) => {
        this.socket!.onopen = () => {
          resolve();
        };
        this.socket!.onclose = (event: any) => {
          // WebSocket closed immediately
          reject(event);
        };
      });
    })();
    this.socket.onmessage = this._onMessage;
    this.socket.onerror = this._onError;
    this.socket.onclose = this._onClose;
    this._flushMessageQueue();
    this.status = SocketStatus.CONNECTED;
    this.lastConnected = Date.now();
  };

  /**
   * Establish a connection to the server
   */
  public $connect = async (): Promise<void> => {
    this.connectionAttempt = 0;
    await this._connect();
  };

  private _onDisconnect = () => {
    this.status = SocketStatus.DISCONNECTED;
    this._rejectMessageQueue();
  };

  /**
   * Disconnect from the server. You must explicitly call $connect to re-establish the connection
   */
  public $disconnect = async () => {
    if (this.socket) {
      this._onDisconnect();
      await (() =>
        new Promise((resolve) => {
          this.socket!.onclose = resolve;
          this.socket!.close();
        }))();
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
    }
  };

  /**
   * Register a callback to be called whenever an error occurs.
   * @returns a function which will remove the listener when called.
   */
  public $onError = (listener: (err: WebSocketError) => void) => {
    const listenerId = uuid();
    this.errorListeners.push({
      id: listenerId,
      listener,
    });
    return () => {
      this.errorListeners = this.errorListeners.filter(
        ({ id }) => id !== listenerId,
      );
    };
  };

  /**
   * Register a callback to be called whenever any message is received.
   */
  public $onAnyMessage = (listener: (route: string, payload?: any) => void) => {
    const listenerId = uuid();
    this.allMessageListeners.push({
      id: listenerId,
      listener,
    });
    return () => {
      this.allMessageListeners = this.allMessageListeners.filter(
        ({ id }) => id !== listenerId,
      );
    };
  };

  /**
   * Send a message to the server
   */
  public $send = async (route: string, payload: any): Promise<void> => {
    await this._sendOrQueueMessage(route, payload);
  };
}
