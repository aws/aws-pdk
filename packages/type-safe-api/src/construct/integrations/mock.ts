/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  ApiGatewayIntegration,
  Integration,
  IntegrationRenderProps,
} from "./integration";
import { generateCorsResponseParameters } from "../prepare-spec-event-handler/prepare-spec";

/**
 * Properties for a mock integration response
 */
export interface MockIntegrationResponse {
  /**
   * HTTP response status code
   */
  readonly statusCode: number;
  /**
   * Response body
   */
  readonly body?: string;
}

/**
 * A mock integration to return a hardcoded response
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-mock-integration.html
 */
export class MockIntegration extends Integration {
  constructor(private readonly props: MockIntegrationResponse) {
    super();
  }

  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    const contentTypes = props.contentTypes ?? ["application/json"];
    return {
      type: "MOCK",
      requestTemplates: Object.fromEntries(
        contentTypes.map((contentType) => [
          contentType,
          `{"statusCode": ${this.props.statusCode}}`,
        ])
      ),
      responses: {
        default: {
          statusCode: `${this.props.statusCode}`,
          responseParameters: props.corsOptions
            ? generateCorsResponseParameters(props.corsOptions)
            : {},
          responseTemplates: Object.fromEntries(
            contentTypes.map((contentType) => [
              contentType,
              this.props.body ?? "",
            ])
          ),
        },
      },
    };
  }
}
