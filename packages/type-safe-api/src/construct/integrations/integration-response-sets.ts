/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  CatchAllErrorIntegrationResponseSet,
  CustomIntegrationResponseSet,
  CustomIntegrationResponseSetProps,
  S3JsonErrorMessageIntegrationResponseSet,
  CompositeIntegrationResponseSet,
  IntegrationResponseSet,
  DefaultPassthroughIntegrationResponseSet,
  DefaultPassthroughIntegrationResponseSetProps,
} from "./integration-response-set";

export class IntegrationResponseSets {
  /**
   * An integration response set which adds a passthrough for the default response
   */
  public static defaultPassthrough(
    props?: DefaultPassthroughIntegrationResponseSetProps
  ): DefaultPassthroughIntegrationResponseSet {
    return new DefaultPassthroughIntegrationResponseSet(props);
  }

  /**
   * An integration response set that returns the error message from S3 in a "message" property of a JSON object
   * for 400, 403, 404 and 500 errors.
   */
  public static s3JsonErrorMessage(): S3JsonErrorMessageIntegrationResponseSet {
    return new S3JsonErrorMessageIntegrationResponseSet();
  }

  /**
   * An integration response set that catches all 4XX and 5XX errors and returns a 500
   */
  public static catchAll(): CatchAllErrorIntegrationResponseSet {
    return new CatchAllErrorIntegrationResponseSet();
  }

  /**
   * A custom integration response set where you can specify the responses as you wish
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-integration-settings-integration-response.html
   */
  public static custom(
    props: CustomIntegrationResponseSetProps
  ): CustomIntegrationResponseSet {
    return new CustomIntegrationResponseSet(props);
  }

  /**
   * Combine the provided integration response sets.
   * Response sets are combined in order, so later responses will override previous ones for
   * overlapping response status patterns.
   */
  public static composite(
    ...responseSets: IntegrationResponseSet[]
  ): CompositeIntegrationResponseSet {
    return new CompositeIntegrationResponseSet(...responseSets);
  }
}
