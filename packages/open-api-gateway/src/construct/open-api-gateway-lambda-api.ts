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

import * as path from "path";
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { CustomResource, Duration, Stack } from "aws-cdk-lib";
import {
  AccessLogFormat,
  ApiDefinition,
  Cors,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApiBaseProps,
  SpecRestApi,
} from "aws-cdk-lib/aws-apigateway";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  CfnPermission,
  Code,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { Provider } from "aws-cdk-lib/custom-resources";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { Authorizers } from "./authorizers";
import { PrepareApiSpecCustomResourceProperties } from "./prepare-spec-event-handler";
import {
  prepareApiSpec,
  PrepareApiSpecOptions,
} from "./prepare-spec-event-handler/prepare-spec";
import { OpenApiOptions } from "./spec";
import {
  prepareSecuritySchemes,
  serializeAsAuthorizerReference,
} from "./spec/api-gateway-auth";
import { getLabelledFunctions } from "./spec/api-gateway-integrations";
import { functionInvocationUri } from "./spec/utils";

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
  /**
   * Path to the JSON open api spec
   */
  readonly specPath: string;
}

/**
 * A construct for creating an api gateway api based on the definition in the OpenAPI spec.
 */
export class OpenApiGatewayLambdaApi extends Construct {
  public readonly api: SpecRestApi;

  constructor(
    scope: Construct,
    id: string,
    props: OpenApiGatewayLambdaApiProps
  ) {
    super(scope, id);

    const {
      integrations,
      spec,
      specPath,
      operationLookup,
      defaultAuthorizer,
      corsOptions,
      ...options
    } = props;

    // Upload the spec to s3 as an asset
    const inputSpecAsset = new Asset(this, "InputSpec", {
      path: specPath,
    });
    // We'll output the prepared spec in the same asset bucket
    const preparedSpecOutputKeyPrefix = `${inputSpecAsset.s3ObjectKey}-prepared`;

    const stack = Stack.of(this);

    const prepareSpecLambdaName = `${PDKNag.getStackPrefix(stack)
      .split("/")
      .join("-")}PrepareSpec`;
    const prepareSpecRole = new Role(this, "PrepareSpecRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        logs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: [
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${prepareSpecLambdaName}`,
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${prepareSpecLambdaName}:*`,
              ],
            }),
          ],
        }),
        s3: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["s3:getObject"],
              resources: [
                inputSpecAsset.bucket.arnForObjects(inputSpecAsset.s3ObjectKey),
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["s3:putObject"],
              resources: [
                // The output file will include a hash of the prepared spec, which is not known until deploy time since
                // tokens must be resolved
                inputSpecAsset.bucket.arnForObjects(
                  `${preparedSpecOutputKeyPrefix}/*`
                ),
              ],
            }),
          ],
        }),
      },
    });

    NagSuppressions.addResourceSuppressions(
      prepareSpecRole,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Cloudwatch resources have been scoped down to the LogGroup level, however * is still needed as stream names are created just in time.",
          appliesTo: [
            {
              regex: `/^Resource::arn:aws:logs:${PDKNag.getStackRegionRegex(
                stack
              )}:${PDKNag.getStackAccountRegex(
                stack
              )}:log-group:/aws/lambda/${prepareSpecLambdaName}:\*/g`,
            },
          ],
        },
      ],
      true
    );

    // Create a custom resource for preparing the spec for deployment (adding integrations, authorizers, etc)
    const prepareSpec = new LambdaFunction(this, "PrepareSpec", {
      handler: "index.handler",
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(
        path.join(__dirname, "../../lib/construct/prepare-spec-event-handler")
      ),
      timeout: Duration.seconds(30),
      role: prepareSpecRole,
      functionName: prepareSpecLambdaName,
    });

    const providerFunctionName = `${prepareSpecLambdaName}-Provider`;
    const providerRole = new Role(this, "PrepareSpecProviderRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        logs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: [
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${providerFunctionName}`,
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${providerFunctionName}:*`,
              ],
            }),
          ],
        }),
      },
    });

    const provider = new Provider(this, "PrepareSpecProvider", {
      onEventHandler: prepareSpec,
      role: providerRole,
      providerFunctionName,
    });

    NagSuppressions.addResourceSuppressions(
      providerRole,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Cloudwatch resources have been scoped down to the LogGroup level, however * is still needed as stream names are created just in time.",
        },
      ],
      true
    );
    NagSuppressions.addResourceSuppressions(
      provider,
      [
        {
          id: "AwsSolutions-L1",
          reason:
            "Latest runtime cannot be configured. CDK will need to upgrade the Provider construct accordingly.",
        },
      ],
      true
    );

    const prepareSpecOptions: PrepareApiSpecOptions = {
      integrations: Object.fromEntries(
        Object.entries(integrations).map(([operation, integration]) => [
          operation,
          {
            functionInvocationUri: functionInvocationUri(
              this,
              integration.function
            ),
            methodAuthorizer: serializeAsAuthorizerReference(
              integration.authorizer || defaultAuthorizer || Authorizers.none()
            ),
          },
        ])
      ),
      securitySchemes: prepareSecuritySchemes(
        this,
        integrations,
        defaultAuthorizer
      ),
      corsOptions: corsOptions && {
        allowHeaders: corsOptions.allowHeaders || Cors.DEFAULT_HEADERS,
        allowMethods: corsOptions.allowMethods || Cors.ALL_METHODS,
        allowOrigins: corsOptions.allowOrigins,
        statusCode: corsOptions.statusCode || 204,
      },
      operationLookup,
    };

    // Spec preparation will happen in a custom resource lambda so that references to lambda integrations etc can be
    // resolved. However, we also prepare inline to perform some additional validation at synth time.
    const preparedSpec = prepareApiSpec(spec, prepareSpecOptions);

    const prepareApiSpecCustomResourceProperties: PrepareApiSpecCustomResourceProperties =
      {
        inputSpecLocation: {
          bucket: inputSpecAsset.bucket.bucketName,
          key: inputSpecAsset.s3ObjectKey,
        },
        outputSpecLocation: {
          bucket: inputSpecAsset.bucket.bucketName,
          key: preparedSpecOutputKeyPrefix,
        },
        ...prepareSpecOptions,
      };

    const prepareSpecCustomResource = new CustomResource(
      this,
      "PrepareSpecCustomResource",
      {
        serviceToken: provider.serviceToken,
        properties: prepareApiSpecCustomResourceProperties,
      }
    );

    // Create the api gateway resources from the spec, augmenting the spec with the properties specific to api gateway
    // such as integrations or auth types
    this.api = new SpecRestApi(this, id, {
      apiDefinition: ApiDefinition.fromBucket(
        inputSpecAsset.bucket,
        prepareSpecCustomResource.getAttString("outputSpecKey")
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

    this.api.node.addDependency(prepareSpecCustomResource);

    // While the api will be updated when the output path from the custom resource changes, CDK still needs to know when
    // to redeploy the api. This is achieved by including a hash of the spec in the logical id (internalised in the
    // addToLogicalId method since this is how changes of individual resources/methods etc trigger redeployments in CDK)
    this.api.latestDeployment?.addToLogicalId(preparedSpec);

    // Grant API Gateway permission to invoke each lambda which implements an integration or custom authorizer
    getLabelledFunctions(props).forEach(({ label, function: lambda }) => {
      new CfnPermission(this, `LambdaPermission-${label}`, {
        action: "lambda:InvokeFunction",
        principal: "apigateway.amazonaws.com",
        functionName: lambda.functionArn,
        sourceArn: stack.formatArn({
          service: "execute-api",
          resource: this.api.restApiId,
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
            {
              regex: `/^Policy::arn:${PDKNag.getStackPartitionRegex(
                stack
              )}:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs$/g`,
            },
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
