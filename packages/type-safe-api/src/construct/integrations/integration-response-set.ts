/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  ApiGatewayIntegrationResponse,
  IntegrationRenderProps,
} from "./integration";
import { generateCorsResponseParameters } from "../prepare-spec-event-handler/prepare-spec";

/**
 * A set of integration responses. You can extend this to implement your own integration response set
 */
export abstract class IntegrationResponseSet {
  /**
   * Render the integration responses into the Integration
   * @param props the integration render props (same used in the Integration)
   */
  public abstract render(props: IntegrationRenderProps): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  };
}

/**
 * An integration response set that catches all errors and returns a 500
 */
export class CatchAllErrorIntegrationResponseSet extends IntegrationResponseSet {
  public render(props: IntegrationRenderProps): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  } {
    return {
      "(4|5)\\d{2}": {
        statusCode: "500",
        responseParameters: props.corsOptions
          ? generateCorsResponseParameters(props.corsOptions)
          : {},
        responseTemplates: {},
      },
    };
  }
}

/**
 * Options for the DefaultPassthroughIntegrationResponseSet
 */
export interface DefaultPassthroughIntegrationResponseSetProps {
  /**
   * Override the status code returned by the default integration response
   * @default 200
   */
  readonly statusCode?: number;
}

/**
 * An integration response set which adds a passthrough for the default response
 */
export class DefaultPassthroughIntegrationResponseSet extends IntegrationResponseSet {
  private readonly statusCode: number;

  constructor(props?: DefaultPassthroughIntegrationResponseSetProps) {
    super();
    this.statusCode = props?.statusCode ?? 200;
  }

  public render(props: IntegrationRenderProps): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  } {
    return {
      default: {
        statusCode: `${this.statusCode}`,
        responseParameters: props.corsOptions
          ? generateCorsResponseParameters(props.corsOptions)
          : {},
        responseTemplates: {},
      },
    };
  }
}

/**
 * An integration response set for S3 errors, that returns a JSON payload with the S3 error message
 */
export class S3JsonErrorMessageIntegrationResponseSet extends IntegrationResponseSet {
  private response(
    props: IntegrationRenderProps,
    status: number
  ): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  } {
    return {
      [`${status}`]: {
        statusCode: `${status}`,
        responseParameters: props.corsOptions
          ? generateCorsResponseParameters(props.corsOptions)
          : {},
        responseTemplates: {
          "application/json": `#set($message = $input.body.split('<Message>')[1].split('</Message>')[0])
{"message": "$util.escapeJavaScript($message).replaceAll("\\'","'")"}
`,
        },
      },
    };
  }

  public render(props: IntegrationRenderProps): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  } {
    return {
      ...this.response(props, 400),
      ...this.response(props, 403),
      ...this.response(props, 404),
      ...this.response(props, 500),
    };
  }
}

/**
 * Properties for a custom integration response set
 */
export interface CustomIntegrationResponseSetProps {
  /**
   * The responses to add to the integration response
   */
  readonly responses?: {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  };
}

/**
 * A custom integration response set where you can specify the responses as you wish
 */
export class CustomIntegrationResponseSet extends IntegrationResponseSet {
  private readonly responses?: {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  };

  constructor(props: CustomIntegrationResponseSetProps) {
    super();

    this.responses = props.responses;
  }

  public render(props: IntegrationRenderProps): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  } {
    return Object.fromEntries(
      Object.entries(this.responses ?? {}).map(
        ([responseStatusPattern, errorResponse]) => [
          responseStatusPattern,
          {
            ...errorResponse,
            responseParameters: {
              ...errorResponse.responseParameters,
              ...(props.corsOptions
                ? generateCorsResponseParameters(props.corsOptions)
                : {}),
            },
          },
        ]
      )
    );
  }
}

/**
 * An integration response set which combines the provided integration response sets.
 * Response sets are combined in order, so later responses will override previous ones for
 * overlapping response status patterns.
 */
export class CompositeIntegrationResponseSet extends IntegrationResponseSet {
  private readonly responseSets: IntegrationResponseSet[];

  constructor(...responseSets: IntegrationResponseSet[]) {
    super();
    this.responseSets = responseSets;
  }

  public render(props: IntegrationRenderProps): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  } {
    return this.responseSets.reduce(
      (responses, responseSet) => ({
        ...responses,
        ...responseSet.render(props),
      }),
      {}
    );
  }
}
