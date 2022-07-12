/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

import { Stack } from "aws-cdk-lib";
import {
  AccessLogFormat,
  ApiDefinition,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApiBaseProps,
  SpecRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { CfnPermission } from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { OpenApiOptions } from "./spec";
import {
  getLabelledFunctions,
  prepareApiSpec,
} from "./spec/api-gateway-integrations";

/**
 * Configuration for the OpenApiGatewayLambdaApi construct
 */
export interface OpenApiGatewayLambdaApiProps
  extends RestApiBaseProps,
    OpenApiOptions {
  /**
   * The parsed OpenAPI specification
   */
  readonly spec: any; // Type is OpenAPIV3.Document - however not transpileable via jsii, so we use any.
}

/**
 * A construct for creating an api gateway api based on the definition in the OpenAPI spec.
 */
export class OpenApiGatewayLambdaApi extends SpecRestApi {
  constructor(
    scope: Construct,
    id: string,
    props: OpenApiGatewayLambdaApiProps
  ) {
    const { integrations, spec, ...options } = props;

    // Create the api gateway resources from the spec, augmenting the spec with the properties specific to api gateway
    // such as integrations or auth types
    super(scope, id, {
      apiDefinition: ApiDefinition.fromInline(
        prepareApiSpec(scope, spec, props)
      ),
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(
          new LogGroup(scope, `AccessLogs`)
        ),
        accessLogFormat: AccessLogFormat.clf(),
        loggingLevel: MethodLoggingLevel.INFO,
      },
      ...options,
    });

    // Grant API Gateway permission to invoke each lambda which implements an integration or custom authorizer
    getLabelledFunctions(props).forEach(({ label, function: lambda }) => {
      new CfnPermission(this, `LambdaPermission-${label}`, {
        action: "lambda:InvokeFunction",
        principal: "apigateway.amazonaws.com",
        functionName: lambda.functionArn,
        sourceArn: Stack.of(this).formatArn({
          service: "execute-api",
          resource: this.restApiId,
          resourceName: "*/*",
        }),
      });
    });

    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          id: "AwsSolutions-IAM4",
          reason:
            "Cloudwatch Role requires access to create/read groups at the root level.",
          appliesTo: [
            "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
          ],
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          id: "AwsSolutions-APIG2",
          reason:
            "This construct implements fine grained validation via OpenApi.",
        },
      ],
      true
    );
  }
}
