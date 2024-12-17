/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from "@aws/pdk-nag";
import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  Distribution,
  IOrigin,
  OriginBindConfig,
  OriginBindOptions,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Key } from "aws-cdk-lib/aws-kms";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  IBucket,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { BucketDeploymentProps } from "./bucket-deployment-props";
import { CloudfrontWebAcl, CloudFrontWebAclProps } from "./cloudfront-web-acl";
import { DistributionProps } from "./distribution-props";
import { lazilyRender } from "./lazy-token-renderer";

const DEFAULT_RUNTIME_CONFIG_FILENAME = "runtime-config.json";

/**
 * Dynamic configuration which gets resolved only during deployment.
 *
 * @example
 *
 * // Will store a JSON file called runtime-config.json in the root of the StaticWebsite S3 bucket containing any
 * // and all resolved values.
 * const runtimeConfig = {jsonPayload: {bucketArn: s3Bucket.bucketArn}};
 * new StaticWebsite(scope, 'StaticWebsite', {websiteContentPath: 'path/to/website', runtimeConfig});
 */
export interface RuntimeOptions {
  /**
   * File name to store runtime configuration (jsonPayload).
   *
   * Must follow pattern: '*.json'
   *
   * @default "runtime-config.json"
   */
  readonly jsonFileName?: string;

  /**
   * Arbitrary JSON payload containing runtime values to deploy. Typically this contains resourceArns, etc which
   * are only known at deploy time.
   *
   * @example { userPoolId: some.userPool.userPoolId, someResourceArn: some.resource.Arn }
   */
  readonly jsonPayload: any;
}

/**
 * Properties for configuring the StaticWebsite.
 */
export interface StaticWebsiteProps {
  /**
   * Path to the directory containing the static website files and assets. This directory must contain an index.html file.
   */
  readonly websiteContentPath: string;

  /**
   * Dynamic configuration which gets resolved only during deployment.
   */
  readonly runtimeOptions?: RuntimeOptions;

  /**
   * Bucket encryption to use for the default bucket.
   *
   * Supported options are KMS or S3MANAGED.
   *
   * Note: If planning to use KMS, ensure you associate a Lambda Edge function to sign requests to S3 as OAI does not currently support KMS encryption. Refer to {@link https://aws.amazon.com/blogs/networking-and-content-delivery/serving-sse-kms-encrypted-content-from-s3-using-cloudfront/}
   *
   * @default - "S3MANAGED"
   */
  readonly defaultWebsiteBucketEncryption?: BucketEncryption;

  /**
   * A predefined KMS customer encryption key to use for the default bucket that gets created.
   *
   * Note: This is only used if the websiteBucket is left undefined, otherwise all settings from the provided websiteBucket will be used.
   */
  readonly defaultWebsiteBucketEncryptionKey?: Key;

  /**
   * Predefined bucket to deploy the website into.
   */
  readonly websiteBucket?: IBucket;

  /**
   * Custom distribution properties.
   *
   * Note: defaultBehaviour.origin is a required parameter, however it will not be used as this construct will wire it on your behalf.
   * You will need to pass in an instance of StaticWebsiteOrigin (NoOp) to keep the compiler happy.
   */
  readonly distributionProps?: DistributionProps;

  /**
   * Custom bucket deployment properties.
   *
   * ```
   */
  readonly bucketDeploymentProps?: BucketDeploymentProps;

  /**
   * Limited configuration settings for the generated webAcl. For more advanced settings, create your own ACL and pass in the webAclId as a param to distributionProps.
   *
   * Note: If pass in your own ACL, make sure the SCOPE is CLOUDFRONT and it is created in us-east-1.
   */
  readonly webAclProps?: CloudFrontWebAclProps;
}

/**
 * Deploys a Static Website using by default a private S3 bucket as an origin and Cloudfront as the entrypoint.
 *
 * This construct configures a webAcl containing rules that are generally applicable to web applications. This
 * provides protection against exploitation of a wide range of vulnerabilities, including some of the high risk
 * and commonly occurring vulnerabilities described in OWASP publications such as OWASP Top 10.
 *
 */
export class StaticWebsite extends Construct {
  public readonly websiteBucket: IBucket;
  public readonly cloudFrontDistribution: Distribution;
  public readonly bucketDeployment: BucketDeployment;

  constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
    super(scope, id);

    this.node.setContext(
      "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy",
      true
    );

    this.validateProps(props);

    const accessLogsBucket = new Bucket(this, "AccessLogsBucket", {
      versioned: false,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // S3 Bucket to hold website files
    this.websiteBucket =
      props.websiteBucket ??
      new Bucket(this, "WebsiteBucket", {
        versioned: true,
        enforceSSL: true,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        encryption:
          props.defaultWebsiteBucketEncryption ?? BucketEncryption.S3_MANAGED,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
        encryptionKey: props.defaultWebsiteBucketEncryptionKey,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        serverAccessLogsPrefix: "website-access-logs",
        serverAccessLogsBucket: accessLogsBucket,
      });

    // Web ACL
    const { distributionProps } = props;
    const webAclArn =
      distributionProps?.webAclId ??
      (props.webAclProps?.disable
        ? undefined
        : new CloudfrontWebAcl(this, "WebsiteAcl", props.webAclProps)
            .webAclArn);

    // Cloudfront Distribution
    const logBucket =
      props.distributionProps?.logBucket ||
      new Bucket(this, "DistributionLogBucket", {
        enforceSSL: true,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        encryption:
          props.defaultWebsiteBucketEncryption ?? BucketEncryption.S3_MANAGED,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
        encryptionKey: props.defaultWebsiteBucketEncryptionKey,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        serverAccessLogsPrefix: "distribution-access-logs",
        serverAccessLogsBucket: accessLogsBucket,
      });

    const defaultRootObject =
      distributionProps?.defaultRootObject ?? "index.html";
    this.cloudFrontDistribution = new Distribution(
      this,
      "CloudfrontDistribution",
      {
        ...distributionProps,
        webAclId: webAclArn,
        enableLogging: true,
        logBucket: logBucket,
        defaultBehavior: {
          ...distributionProps?.defaultBehavior,
          origin: S3BucketOrigin.withOriginAccessControl(this.websiteBucket),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject,
        errorResponses: distributionProps?.errorResponses ?? [
          {
            httpStatus: 404, // We need to redirect "key not found errors" to index.html for single page apps
            responseHttpStatus: 200,
            responsePagePath: `/${defaultRootObject}`,
          },
        ],
      }
    );

    // Deploy Website
    this.bucketDeployment = new BucketDeployment(this, "WebsiteDeployment", {
      ...props.bucketDeploymentProps,
      sources: [
        Source.asset(props.websiteContentPath),
        ...(props.runtimeOptions
          ? [
              Source.jsonData(
                props.runtimeOptions?.jsonFileName ||
                  DEFAULT_RUNTIME_CONFIG_FILENAME,
                lazilyRender(this, props.runtimeOptions.jsonPayload)
              ),
            ]
          : []),
      ],
      destinationBucket: this.websiteBucket,
      // Files in the distribution's edge caches will be invalidated after files are uploaded to the destination bucket.
      distribution: this.cloudFrontDistribution,
    });

    new CfnOutput(this, "DistributionDomainName", {
      value: this.cloudFrontDistribution.domainName,
    });

    this.suppressCDKNagViolations(props);
  }

  private validateProps = (props: StaticWebsiteProps) => {
    this.validateEncryptionSettings(props);
    props.runtimeOptions && this.validateRuntimeConfig(props.runtimeOptions);
    props.websiteBucket && this.validateBucketConfig(props.websiteBucket);
  };

  private validateRuntimeConfig = (config: RuntimeOptions) => {
    if (!config) {
      throw new Error(
        "validateRuntimeConfig only accepts non-null RuntimeOptions."
      );
    }

    if (config.jsonFileName && !config.jsonFileName.endsWith(".json")) {
      throw new Error("RuntimeOptions.jsonFileName must be a json file.");
    }
  };

  private validateBucketConfig = (bucket: IBucket) => {
    if (bucket.isWebsite) {
      throw new Error(
        "Website buckets cannot be configured as websites as this will break Cloudfront hosting!"
      );
    }
  };

  private validateEncryptionSettings = ({
    defaultWebsiteBucketEncryption,
    defaultWebsiteBucketEncryptionKey,
  }: StaticWebsiteProps) => {
    if (
      defaultWebsiteBucketEncryptionKey &&
      defaultWebsiteBucketEncryption !== BucketEncryption.KMS
    ) {
      throw new Error(
        "Bucket encryption should be set to KMS if providing a defaultWebsiteBucketEncryptionKey."
      );
    }

    if (
      defaultWebsiteBucketEncryption &&
      defaultWebsiteBucketEncryption !== BucketEncryption.KMS &&
      defaultWebsiteBucketEncryption !== BucketEncryption.S3_MANAGED
    ) {
      throw new Error(
        "Only KMS and S3_MANAGED encryption are supported on the default bucket."
      );
    }
  };

  private suppressCDKNagViolations = (props: StaticWebsiteProps) => {
    const stack = Stack.of(this);
    !props.distributionProps?.certificate &&
      [
        "AwsSolutions-CFR4",
        "AwsPrototyping-CloudFrontDistributionHttpsViewerNoOutdatedSSL",
      ].forEach((RuleId) => {
        NagSuppressions.addResourceSuppressions(this.cloudFrontDistribution, [
          {
            id: RuleId,
            reason:
              "Certificate is not mandatory therefore the Cloudfront certificate will be used.",
          },
        ]);
      });

    ["AwsSolutions-L1", "AwsPrototyping-LambdaLatestVersion"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          this,
          [
            {
              id: RuleId,
              reason:
                "Latest runtime cannot be configured. CDK will need to upgrade the BucketDeployment construct accordingly.",
            },
          ],
          true
        );
      }
    );

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          this,
          [
            {
              id: RuleId,
              reason:
                "All Policies have been scoped to a Bucket. Given Buckets can contain arbitrary content, wildcard resources with bucket scope are required.",
              appliesTo: [
                {
                  regex: "/^Action::s3:.*$/g",
                },
                {
                  regex: `/^Resource::.*$/g`,
                },
              ],
            },
          ],
          true
        );
      }
    );

    ["AwsSolutions-IAM4", "AwsPrototyping-IAMNoManagedPolicies"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          this,
          [
            {
              id: RuleId,
              reason:
                "Buckets can contain arbitrary content, therefore wildcard resources under a bucket are required.",
              appliesTo: [
                {
                  regex: `/^Policy::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole$/g`,
                },
              ],
            },
          ],
          true
        );
      }
    );

    ["AwsSolutions-S1", "AwsPrototyping-S3BucketLoggingEnabled"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          this,
          [
            {
              id: RuleId,
              reason: "Access Log buckets should not have s3 bucket logging",
            },
          ],
          true
        );
      }
    );
  };
}

/**
 * If passing in distributionProps, the default behaviour.origin is a required parameter. An instance of this class can be passed in
 * to make the compiler happy.
 */
export class StaticWebsiteOrigin implements IOrigin {
  bind(_scope: Construct, _options: OriginBindOptions): OriginBindConfig {
    throw new Error("This should never be called");
  }
}
