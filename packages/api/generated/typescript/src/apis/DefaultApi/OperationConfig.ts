// Import models
import {
    ApiError,
    ApiErrorFromJSON,
    ApiErrorToJSON,
    HelloResponse,
    HelloResponseFromJSON,
    HelloResponseToJSON,
} from '../../models';
// Import request parameter interfaces
import {
    SayHelloRequest,
} from '..';

// Generic type for object keyed by operation names
export interface OperationConfig<T> {
    sayHello: T;
}

// Look up path and http method for a given operation name
export const OperationLookup = {
    sayHello: {
        path: '/hello',
        method: 'GET',
    },
};

// Standard apigateway request parameters (query parameters or path parameters, multi or single value)
type ApiGatewayRequestParameters = { [key: string]: string | string[] | undefined };

/**
 * URI decode for a string or array of strings
 */
const uriDecode = (value: string | string[]): string | string[] =>
    typeof value === 'string' ? decodeURIComponent(value) : value.map((v) => decodeURIComponent(v));

/**
 * URI decodes apigateway request parameters (query or path parameters)
 */
const decodeRequestParameters = (parameters: ApiGatewayRequestParameters): ApiGatewayRequestParameters => {
    const decodedParameters = {};
    Object.keys(parameters || {}).forEach((key) => {
        decodedParameters[key] = parameters[key] ? uriDecode(parameters[key]) : parameters[key];
    });
    return decodedParameters;
};

/**
 * Parse the body if the content type is json, otherwise leave as a raw string
 */
const parseBody = (body: string, demarshal: (body: string) => any, contentTypes: string[]): any => contentTypes.filter((contentType) => contentType !== 'application/json').length === 0 ? demarshal(body || '{}') : body;

// Api gateway lambda handler type
type ApiGatewayLambdaHandler = (event: any, context: any) => Promise<any>;

// Type of the response to be returned by an operation lambda handler
export interface OperationResponse<StatusCode extends number, Body> {
    statusCode: StatusCode;
    headers?: { [key: string]: string };
    body: Body;
}

// Input for a lambda handler for an operation
export type LambdaRequestParameters<RequestParameters, RequestArrayParameters, RequestBody> = {
    requestParameters: RequestParameters,
    requestArrayParameters: RequestArrayParameters,
    body: RequestBody,
};

/**
 * A lambda handler function which is part of a chain. It may invoke the remainder of the chain via the given chain input
 */
export type ChainedLambdaHandlerFunction<RequestParameters, RequestArrayParameters, RequestBody, Response> = (
  input: LambdaRequestParameters<RequestParameters, RequestArrayParameters, RequestBody>,
  event: any,
  context: any,
  chain: LambdaHandlerChain<RequestParameters, RequestArrayParameters, RequestBody, Response>,
) => Promise<Response>;

// Type for a lambda handler function to be wrapped
export type LambdaHandlerFunction<RequestParameters, RequestArrayParameters, RequestBody, Response> = (
  input: LambdaRequestParameters<RequestParameters, RequestArrayParameters, RequestBody>,
  event: any,
  context: any,
) => Promise<Response>;

export interface LambdaHandlerChain<RequestParameters, RequestArrayParameters, RequestBody, Response> {
  next: LambdaHandlerFunction<RequestParameters, RequestArrayParameters, RequestBody, Response>;
}

/**
 * Build a chain from the given array of chained lambda handlers
 */
const buildHandlerChain = <RequestParameters, RequestArrayParameters, RequestBody, Response>(...handlers: ChainedLambdaHandlerFunction<RequestParameters, RequestArrayParameters, RequestBody, Response>[]): LambdaHandlerChain<RequestParameters, RequestArrayParameters, RequestBody, Response> => {
  if (handlers.length === 0) {
    return {
      next: () => {
        throw new Error("No more handlers remain in the chain! The last handler should not call next.");
      }
    };
  }
  const [currentHandler, ...remainingHandlers] = handlers;
  return {
    next: (input, event, context) => {
      return currentHandler(input, event, context, buildHandlerChain(...remainingHandlers));
    },
  };
};

/**
 * Single-value path/query parameters for SayHello
 */
export interface SayHelloRequestParameters {
    readonly name: string;
}

/**
 * Multi-value query parameters for SayHello
 */
export interface SayHelloRequestArrayParameters {
}

/**
 * Request body parameter for SayHello
 */
export type SayHelloRequestBody = never;

export type SayHello200OperationResponse = OperationResponse<200, HelloResponse>;
export type SayHello400OperationResponse = OperationResponse<400, ApiError>;
export type SayHelloOperationResponses = | SayHello200OperationResponse | SayHello400OperationResponse ;

// Type that the handler function provided to the wrapper must conform to
export type SayHelloHandlerFunction = ChainedLambdaHandlerFunction<SayHelloRequestParameters, SayHelloRequestArrayParameters, SayHelloRequestBody, SayHelloOperationResponses>;

/**
 * Lambda handler wrapper to provide typed interface for the implementation of sayHello
 */
export const sayHelloHandler = (firstHandler: SayHelloHandlerFunction, ...remainingHandlers: SayHelloHandlerFunction[]): ApiGatewayLambdaHandler => async (event: any, context: any): Promise<any> => {
    const requestParameters = decodeRequestParameters({
        ...(event.pathParameters || {}),
        ...(event.queryStringParameters || {}),
    }) as unknown as SayHelloRequestParameters;

    const requestArrayParameters = decodeRequestParameters({
        ...(event.multiValueQueryStringParameters || {}),
    }) as unknown as SayHelloRequestArrayParameters;

    const demarshal = (bodyString: string): any => {
        let parsed = JSON.parse(bodyString);
        return parsed;
    };
    const body = parseBody(event.body, demarshal, ['application/json']) as SayHelloRequestBody;

    const chain = buildHandlerChain(firstHandler, ...remainingHandlers);
    const response = await chain.next({
        requestParameters,
        requestArrayParameters,
        body,
    }, event, context);

    const marshal = (statusCode: number, responseBody: any): string => {
        let marshalledBody = responseBody;
        switch(statusCode) {
            case 200:
                marshalledBody = JSON.stringify(HelloResponseToJSON(marshalledBody));
                break;
            case 400:
                marshalledBody = JSON.stringify(ApiErrorToJSON(marshalledBody));
                break;
            default:
                break;
        }

        return marshalledBody;
    };

    return {
        ...response,
        body: response.body ? marshal(response.statusCode, response.body) : '',
    };
};
