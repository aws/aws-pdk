/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { IRole, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { IConstruct } from "constructs";
import {
  ApiGatewayIntegration,
  Integration,
  IntegrationGrantProps,
  IntegrationRenderProps,
} from "./integration";
import { IntegrationResponseSet } from "./integration-response-set";
import { IntegrationResponseSets } from "./integration-response-sets";
import { Method } from "../spec";
import { bucketInvocationUri } from "../spec/utils";

/**
 * Options for S3Integration
 */
export interface S3IntegrationProps {
  /**
   * The S3 bucket to be invoked on integration
   */
  readonly bucket: IBucket;

  /**
   * The HTTP method to use when invoking the S3 bucket
   * @default - integration method is used
   */
  readonly method?: Method;

  /**
   * The path override to use when invoking the S3 bucket
   * @default - integration path is used
   */
  readonly path?: string;

  /**
   * Override the integration response set for the S3 integration
   * @default - a combination of IntegrationResponseSets.defaultPassthrough() and IntegrationResponseSets.s3JsonErrorMessage()
   */
  readonly integrationResponseSet?: IntegrationResponseSet;
}

/**
 * An S3 integration
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html
 */
export class S3Integration extends Integration {
  private readonly bucket: IBucket;
  private readonly method?: Method;
  private readonly path?: string;
  private readonly integrationResponseSet?: IntegrationResponseSet;

  private readonly executionRoleId = "S3IntegrationsExecutionRole";

  constructor(props: S3IntegrationProps) {
    super();

    this.bucket = props.bucket;
    this.method = props.method;
    this.path = props.path;
    this.integrationResponseSet = props.integrationResponseSet;
  }

  private executionRole(scope: IConstruct): IRole {
    // Retrieve or create the shared S3 execution role
    return (scope.node.tryFindChild(this.executionRoleId) ??
      new Role(scope, this.executionRoleId, {
        assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      })) as IRole;
  }

  /**
   * Render the S3 integration as a snippet of OpenAPI
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      type: "AWS",
      httpMethod: (this.method ?? props.method).toUpperCase(),
      uri: bucketInvocationUri(this.bucket, this.path ?? props.path),
      credentials: this.executionRole(props.scope).roleArn,
      requestParameters: {
        // Add every path parameter to the integration request
        ...Object.fromEntries(
          [...props.path.matchAll(/\{([^\}]*)\}/g)]
            .map((m) => m[1])
            .map((param) => [
              `integration.request.path.${param}`,
              `method.request.path.${param}`,
            ])
        ),
      },
      responses: {
        ...(
          this.integrationResponseSet ??
          IntegrationResponseSets.composite(
            IntegrationResponseSets.defaultPassthrough(),
            IntegrationResponseSets.s3JsonErrorMessage()
          )
        ).render(props),
      },
    };
  }

  /**
   * Grant API Gateway permissions to invoke the S3 bucket
   */
  public grant({ scope, method, path }: IntegrationGrantProps) {
    const executionRole = this.executionRole(scope);

    // Replace path parameters with * to grant access to arbitrary values for path parameters
    const permissionPath = (this.path ?? path).replace(/{[^\}]*\}/g, "*");

    // Grant read access for GET/HEAD/OPTIONS/TRACE, otherwise write
    if (
      ["get", "head", "options", "trace"].includes(
        (this.method ?? method).toLowerCase()
      )
    ) {
      this.bucket.grantRead(executionRole, permissionPath);
    } else {
      this.bucket.grantWrite(executionRole, permissionPath);
    }
  }
}
