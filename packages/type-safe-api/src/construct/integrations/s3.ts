/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { IRole, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import {
  ApiGatewayIntegration,
  Integration,
  IntegrationRenderProps,
} from "./integration";
import { generateCorsResponseParameters } from "../prepare-spec-event-handler/prepare-spec";
import { bucketInvocationUri } from "../spec/utils";

export interface S3IntegrationProps {
  /**
   * The S3 bucket to be invoked on integration
   */
  readonly bucket: IBucket;

  /**
   * The IAM role to be used to grant permissions to the API Gateway to invoke the S3 bucket
   * @default - a new role will be created
   */
  readonly role?: IRole;

  /**
   * The path override for the integration
   * @default - integration path is used
   */
  readonly pathOverride?: string;
}

/**
 * An S3 integration
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html
 */
export class S3Integration extends Integration {
  private readonly bucket: IBucket;
  private readonly role: IRole;
  private readonly pathOverride?: string;

  constructor(props: S3IntegrationProps) {
    super();

    this.bucket = props.bucket;

    if (props.role) {
      this.role = props.role;
    } else {
      this.role = new Role(this.bucket, "Role", {
        assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      });
    }

    this.bucket.grantReadWrite(this.role, this.pathOverride ?? "*");
    this.pathOverride = props.pathOverride;
  }

  /**
   * Render the lambda integration as a snippet of OpenAPI
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      type: "AWS",
      httpMethod: props.method.toUpperCase(),
      uri: bucketInvocationUri(this.bucket, this.pathOverride ?? props.path),
      credentials: this.role.roleArn,
      responses: {
        default: {
          statusCode: "200",
          responseParameters: props.corsOptions
            ? generateCorsResponseParameters(props.corsOptions)
            : {},
          responseTemplates: {},
        },
        "4|5\\d{2}": {
          statusCode: "500", // force 500 because 4XX errors is not a real client error, it's a misconfiguration on the server side
          responseParameters: props.corsOptions
            ? generateCorsResponseParameters(props.corsOptions)
            : {},
          responseTemplates: {},
        },
      },
    };
  }
}
