/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  CatchAllErrorIntegrationResponse,
  CustomErrorIntegrationResponse,
  CustomErrorIntegrationResponseProps,
  NoneErrorIntegrationResponse,
} from "./error-integration-response";

export class ErrorIntegrationResponses {
  /**
   * An error integration response that returns no error responses
   */
  public static none(): NoneErrorIntegrationResponse {
    return new NoneErrorIntegrationResponse();
  }

  /**
   * An error integration response that catches all errors and returns a 500
   */
  public static catchAll(): CatchAllErrorIntegrationResponse {
    return new CatchAllErrorIntegrationResponse();
  }

  /**
   * A custom error integration response where you can specify the error responses as you wish
   * @param props the integration props
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-integration-settings-integration-response.html
   */
  public static custom(
    props: CustomErrorIntegrationResponseProps
  ): CustomErrorIntegrationResponse {
    return new CustomErrorIntegrationResponse(props);
  }
}
