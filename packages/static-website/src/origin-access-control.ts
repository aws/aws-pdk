/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { ArnFormat, CustomResource, Stack } from "aws-cdk-lib";
import {
  CfnDistribution,
  CfnOriginAccessControl,
  Distribution,
} from "aws-cdk-lib/aws-cloudfront";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { CfnBucketPolicy, IBucket } from "aws-cdk-lib/aws-s3";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

/**
 * Props for the Origin Access Control.
 */
export interface OriginAccessControlProps {
  /**
   * The Distribution to apply OAC to.
   */
  readonly distribution: Distribution;

  /**
   * The bucket to apply OAC to.
   */
  readonly bucket: IBucket;
}

/**
 * Creates and associates a OriginAccessControl to a distribution and bucket.
 *
 * @stability experimental
 */
export class OriginAccessControl extends Construct {
  public readonly oac;
  constructor(scope: Construct, id: string, props: OriginAccessControlProps) {
    super(scope, id);

    const { distribution, bucket } = props;
    const stack = Stack.of(this);
    this.oac = new CfnOriginAccessControl(this, `${id}-OAC`, {
      originAccessControlConfig: {
        name: `${stack.stackName}_OAC`,
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });

    const cfnDistribution = distribution.node.defaultChild as CfnDistribution;
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.0.OriginAccessControlId",
      this.oac.getAtt("Id")
    ); // Set OAC reference
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity",
      ""
    ); // Don't reference OAI
    distribution.node
      .findAll()
      .find((child) => child.node.id === "S3Origin")
      ?.node.tryRemoveChild("Resource"); // Remove OAI resource

    const comS3PolicyOverride = bucket.node.findChild("Policy").node
      .defaultChild as CfnBucketPolicy;
    const bucketPolicy = bucket.policy?.document.toJSON();
    const bucketPolicyUpdated = {
      Version: "2012-10-17",
      Statement: [] as any[],
    };

    bucketPolicy.Statement.forEach((s: any) => {
      !s.Principal.CanonicalUser && bucketPolicyUpdated.Statement.push(s);
    });

    comS3PolicyOverride.addOverride(
      "Properties.PolicyDocument",
      bucketPolicyUpdated
    );

    const distributionArn = stack.formatArn({
      service: "cloudfront",
      resource: "distribution",
      region: "",
      resourceName: distribution.distributionId,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    const onEventHandler = new NodejsFunction(this, "UpdatePolicy", {
      entry: path.join(__dirname, "update_policy_handler/index.ts"),
      environment: {
        REGION: stack.region,
      },
    });
    onEventHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:GetBucketPolicy", "s3:PutBucketPolicy"],
        resources: [bucket.bucketArn],
      })
    );
    bucket.encryptionKey &&
      onEventHandler.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["kms:GetKeyPolicy", "kms:PutKeyPolicy"],
          resources: [bucket.encryptionKey.keyArn],
        })
      );

    const provider = new Provider(this, "UpdatePolicyProvider", {
      onEventHandler,
    });
    new CustomResource(this, "UpdatePolicyCustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        BUCKET_NAME: bucket.bucketName,
        BUCKET_RESOURCES: bucket.arnForObjects("*"),
        DISTRIBUTION_ARN: distributionArn,
        KEY_ID: bucket.encryptionKey?.keyId,
      },
    }).node.addDependency(bucket.policy!);
  }
}
