/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  ApiGatewayIntegrationResponse,
  IntegrationRenderProps,
} from "./integration";
import { generateCorsResponseParameters } from "../prepare-spec-event-handler/prepare-spec";

/**
 * An error integration response. You can extend this to implement your own error integration response
 */
export abstract class ErrorIntegrationResponse {
  /**
   * Render the error integration response into the Integration
   * @param props the integration render props (same used in the Integration)
   */
  public abstract render(props: IntegrationRenderProps): {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  };
}

/**
 * An error integration response that returns no error responses
 */
export class NoneErrorIntegrationResponse extends ErrorIntegrationResponse {
  render() {
    return {};
  }
}

/**
 * An error integration response that catches all errors and returns a 500
 */
export class CatchAllErrorIntegrationResponse extends ErrorIntegrationResponse {
  render(props: IntegrationRenderProps) {
    return {
      "4|5\\d{2}": {
        statusCode: "500",
        responseParameters: props.corsOptions
          ? generateCorsResponseParameters(props.corsOptions)
          : {},
        responseTemplates: {},
      },
    };
  }
}

export interface CustomErrorIntegrationResponseProps {
  /**
   * The error responses to add to the integration response
   */
  readonly errorResponses?: {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  };
}

/**
 * A custom error integration response where you can specify the error responses as you wish
 */
export class CustomErrorIntegrationResponse extends ErrorIntegrationResponse {
  private readonly errorResponses?: {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  };

  constructor(props: CustomErrorIntegrationResponseProps) {
    super();

    this.errorResponses = props.errorResponses;
  }

  render(props: IntegrationRenderProps) {
    const result: {
      [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
    } = {};

    for (const responseStatusPattern in this.errorResponses) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.errorResponses,
          responseStatusPattern
        )
      ) {
        var errorResponse = this.errorResponses[responseStatusPattern];

        if (props.corsOptions) {
          errorResponse = {
            statusCode: errorResponse.statusCode,
            responseTemplates: errorResponse.responseTemplates,
            responseParameters: {
              ...errorResponse.responseParameters,
              ...generateCorsResponseParameters(props.corsOptions),
            },
            contentHandling: errorResponse.contentHandling,
          };
        }

        result[responseStatusPattern] = errorResponse;
      }
    }

    return result;
  }
}
