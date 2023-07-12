/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { CustomResource, Duration, Size, Stack } from "aws-cdk-lib";
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
import {
  CfnIPSet,
  CfnWebACL,
  CfnWebACLAssociation,
} from "aws-cdk-lib/aws-wafv2";
import { Provider } from "aws-cdk-lib/custom-resources";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { PrepareApiSpecCustomResourceProperties } from "./prepare-spec-event-handler";
import {
  prepareApiSpec,
  PrepareApiSpecOptions,
} from "./prepare-spec-event-handler/prepare-spec";
import { SerializedCorsOptions, TypeSafeApiOptions } from "./spec";
import {
  prepareSecuritySchemes,
  serializeAsAuthorizerReference,
} from "./spec/api-gateway-auth";
import { getAuthorizerFunctions } from "./spec/api-gateway-integrations";
import { OpenApiGatewayWebAcl } from "./waf/open-api-gateway-web-acl";
import { TypeSafeApiWebAclOptions } from "./waf/types";

/**
 * Configuration for the TypeSafeRestApi construct
 */
export interface TypeSafeRestApiProps
  extends RestApiBaseProps,
    TypeSafeApiOptions {
  /**
   * Path to the JSON open api spec
   */
  readonly specPath: string;
  /**
   * Options for the AWS WAF v2 WebACL associated with the api. By default, a Web ACL with the AWS default managed
   * rule set will be associated with the API. These options may disable or override the defaults.
   */
  readonly webAclOptions?: TypeSafeApiWebAclOptions;

  /**
   * A Size(in bytes, kibibytes, mebibytes etc) that is used to enable compression (with non-negative
   * between 0 and 10485760 (10M) bytes, inclusive) or disable compression
   * (when undefined) on an API. When compression is enabled, compression or
   * decompression is not applied on the payload if the payload size is
   * smaller than this value. Setting it to zero allows compression for any
   * payload size.
   *
   * @default - Compression is disabled.
   */
  readonly minCompressionSize?: Size;
}

/**
 * A construct for creating an api gateway rest api based on the definition in the OpenAPI spec.
 */
export class TypeSafeRestApi extends Construct {
  /**
   * Underlying API Gateway API construct
   */
  public readonly api: SpecRestApi;
  /**
   * The OpenAPI specification with applied API gateway extensions
   */
  readonly extendedApiSpecification: any;
  /**
   * Reference to the webacl, if created
   */
  readonly webAcl?: CfnWebACL;
  /**
   * Reference to the IP set if created
   */
  readonly ipSet?: CfnIPSet;
  /**
   * Reference to the web acl association if created
   */
  readonly webAclAssociation?: CfnWebACLAssociation;

  constructor(scope: Construct, id: string, props: TypeSafeRestApiProps) {
    super(scope, id);

    const {
      integrations,
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
      .join("-")}PrepareSpec${this.node.addr.slice(-8).toUpperCase()}`;
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

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          prepareSpecRole,
          [
            {
              id: RuleId,
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
            {
              id: RuleId,
              reason:
                "S3 resources have been scoped down to the appropriate prefix in the CDK asset bucket, however * is still needed as since the prepared spec hash is not known until deploy time.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:s3:.*/${preparedSpecOutputKeyPrefix}/\*/g`,
                },
              ],
            },
          ],
          true
        );
      }
    );

    // Create a custom resource for preparing the spec for deployment (adding integrations, authorizers, etc)
    const prepareSpec = new LambdaFunction(this, "PrepareSpec", {
      handler: "index.handler",
      runtime: Runtime.NODEJS_18_X,
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

    const provider = new Provider(this, "PrepareSpecResourceProvider", {
      onEventHandler: prepareSpec,
      role: providerRole,
      providerFunctionName,
    });

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          providerRole,
          [
            {
              id: RuleId,
              reason:
                "Cloudwatch resources have been scoped down to the LogGroup level, however * is still needed as stream names are created just in time.",
            },
          ],
          true
        );
      }
    );

    ["AwsSolutions-L1", "AwsPrototyping-LambdaLatestVersion"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          provider,
          [
            {
              id: RuleId,
              reason:
                "Latest runtime cannot be configured. CDK will need to upgrade the Provider construct accordingly.",
            },
          ],
          true
        );
      }
    );

    const serializedCorsOptions: SerializedCorsOptions | undefined =
      corsOptions && {
        allowHeaders: corsOptions.allowHeaders || [
          ...Cors.DEFAULT_HEADERS,
          "x-amz-content-sha256",
        ],
        allowMethods: corsOptions.allowMethods || Cors.ALL_METHODS,
        allowOrigins: corsOptions.allowOrigins,
        statusCode: corsOptions.statusCode || 204,
      };

    const prepareSpecOptions: PrepareApiSpecOptions = {
      defaultAuthorizerReference:
        serializeAsAuthorizerReference(defaultAuthorizer),
      integrations: Object.fromEntries(
        Object.entries(integrations).map(([operationId, integration]) => [
          operationId,
          {
            integration: integration.integration.render({
              operationId,
              scope: this,
              ...operationLookup[operationId],
              corsOptions: serializedCorsOptions,
            }),
            methodAuthorizer: serializeAsAuthorizerReference(
              integration.authorizer
            ),
            options: integration.options,
          },
        ])
      ),
      securitySchemes: prepareSecuritySchemes(
        this,
        integrations,
        defaultAuthorizer,
        options.apiKeyOptions
      ),
      corsOptions: serializedCorsOptions,
      operationLookup,
      apiKeyOptions: options.apiKeyOptions,
    };

    // Spec preparation will happen in a custom resource lambda so that references to lambda integrations etc can be
    // resolved. However, we also prepare inline to perform some additional validation at synth time.
    const spec = JSON.parse(fs.readFileSync(specPath, "utf-8"));
    this.extendedApiSpecification = prepareApiSpec(spec, prepareSpecOptions);

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
      apiDefinition: this.node.tryGetContext("type-safe-api-local")
        ? ApiDefinition.fromInline(this.extendedApiSpecification)
        : ApiDefinition.fromBucket(
            inputSpecAsset.bucket,
            prepareSpecCustomResource.getAttString("outputSpecKey")
          ),
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(
          new LogGroup(this, `AccessLogs`)
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
    this.api.latestDeployment?.addToLogicalId(this.extendedApiSpecification);

    // Grant API Gateway permission to invoke the integrations
    Object.keys(integrations).forEach((operationId) => {
      integrations[operationId].integration.grant({
        operationId,
        scope: this,
        api: this.api,
        ...operationLookup[operationId],
      });
    });

    // Grant API Gateway permission to invoke each custom authorizer lambda (if any)
    getAuthorizerFunctions(props).forEach(({ label, function: lambda }) => {
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

    // Create and associate the web acl if not disabled
    if (!props.webAclOptions?.disable) {
      const acl = new OpenApiGatewayWebAcl(this, `${id}-Acl`, {
        ...props.webAclOptions,
        apiDeploymentStageArn: this.api.deploymentStage.stageArn,
      });

      this.webAcl = acl.webAcl;
      this.ipSet = acl.ipSet;
      this.webAclAssociation = acl.webAclAssociation;
    }

    ["AwsSolutions-IAM4", "AwsPrototyping-IAMNoManagedPolicies"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          this,
          [
            {
              id: RuleId,
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
      }
    );

    ["AwsSolutions-APIG2", "AwsPrototyping-APIGWRequestValidation"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          this,
          [
            {
              id: RuleId,
              reason:
                "This construct implements fine grained validation via OpenApi.",
            },
          ],
          true
        );
      }
    );
  }
}
