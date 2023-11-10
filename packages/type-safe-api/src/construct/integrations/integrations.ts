/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration } from "./lambda";
import { MockIntegration, MockIntegrationResponse } from "./mock";
import { S3Integration, S3IntegrationProps } from "./s3";

/**
 * A collection of integrations to connect API operations with a backend to service requests
 */
export class Integrations {
  /**
   * An integration that invokes a lambda function to service the request
   * @param lambdaFunction the function to invoke
   */
  public static lambda(lambdaFunction: IFunction): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction);
  }

  /**
   * An integration that returns a hardcoded response
   * @param response the response to return
   */
  public static mock(response: MockIntegrationResponse): MockIntegration {
    return new MockIntegration(response);
  }

  /**
   * An integration that can read/write to an S3 bucket
   * @param props the integration props
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html
   */
  public static s3(props: S3IntegrationProps): S3Integration {
    return new S3Integration(props);
  }
}
