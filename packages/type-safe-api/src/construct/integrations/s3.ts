/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { IRole, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { ErrorIntegrationResponse } from "./error-integration-response";
import { ErrorIntegrationResponses } from "./error-integration-responses";
import {
  ApiGatewayIntegration,
  Integration,
  IntegrationRenderProps,
} from "./integration";
import { generateCorsResponseParameters } from "../prepare-spec-event-handler/prepare-spec";
import { Method } from "../spec";
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
   * The error integration response to use when the S3 bucket returns an error
   * @default ErrorIntegrationResponses.catchAll()
   */
  readonly errorIntegrationResponse?: ErrorIntegrationResponse;
}

/**
 * An S3 integration
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html
 */
export class S3Integration extends Integration {
  private readonly bucket: IBucket;
  private readonly role: IRole;
  private readonly method?: Method;
  private readonly path?: string;
  private readonly errorIntegrationResponse?: ErrorIntegrationResponse;

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

    this.bucket.grantReadWrite(this.role, this.path ?? "*");
    this.method = props.method;
    this.path = props.path;
    this.errorIntegrationResponse = props.errorIntegrationResponse;
  }

  /**
   * Render the S3 integration as a snippet of OpenAPI
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      type: "AWS",
      httpMethod: (this.method ?? props.method).toUpperCase(),
      uri: bucketInvocationUri(this.bucket, this.path ?? props.path),
      credentials: this.role.roleArn,
      responses: {
        default: {
          statusCode: "200",
          responseParameters: props.corsOptions
            ? generateCorsResponseParameters(props.corsOptions)
            : {},
          responseTemplates: {},
        },

        ...(
          this.errorIntegrationResponse ?? ErrorIntegrationResponses.catchAll()
        ).render(props),
      },
    };
  }
}
