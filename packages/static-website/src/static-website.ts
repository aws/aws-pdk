/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  Distribution,
  DistributionProps,
  IOrigin,
  OriginAccessIdentity,
  OriginBindConfig,
  OriginBindOptions,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as iam from "aws-cdk-lib/aws-iam";
import { Key } from "aws-cdk-lib/aws-kms";
import * as logs from "aws-cdk-lib/aws-logs";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  IBucket,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  BucketDeployment,
  CacheControl,
  ServerSideEncryption,
  Source,
  StorageClass,
} from "aws-cdk-lib/aws-s3-deployment";
import * as cdk from "aws-cdk-lib/core";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { CloudfrontWebAcl, CloudFrontWebAclProps } from "./cloudfront-web-acl";

const DEFAULT_RUNTIME_CONFIG_FILENAME = "runtime-config.json";

/**
 * Bucket Deployment props.
 *
 * NOTE: forked from aws-cdk-lib/s3-deployment without any required props.
 */
export interface BucketDeploymentProps {
  /**
   * Key prefix in the destination bucket.
   *
   * Must be <=104 characters
   *
   * @default "/" (unzip to root of the destination bucket)
   */
  readonly destinationKeyPrefix?: string;
  /**
   * If this is set, the zip file will be synced to the destination S3 bucket and extracted.
   * If false, the file will remain zipped in the destination bucket.
   * @default true
   */
  readonly extract?: boolean;
  /**
   * If this is set, matching files or objects will be excluded from the deployment's sync
   * command. This can be used to exclude a file from being pruned in the destination bucket.
   *
   * If you want to just exclude files from the deployment package (which excludes these files
   * evaluated when invalidating the asset), you should leverage the `exclude` property of
   * `AssetOptions` when defining your source.
   *
   * @default - No exclude filters are used
   * @see https://docs.aws.amazon.com/cli/latest/reference/s3/index.html#use-of-exclude-and-include-filters
   */
  readonly exclude?: string[];
  /**
   * If this is set, matching files or objects will be included with the deployment's sync
   * command. Since all files from the deployment package are included by default, this property
   * is usually leveraged alongside an `exclude` filter.
   *
   * @default - No include filters are used and all files are included with the sync command
   * @see https://docs.aws.amazon.com/cli/latest/reference/s3/index.html#use-of-exclude-and-include-filters
   */
  readonly include?: string[];
  /**
   * If this is set to false, files in the destination bucket that
   * do not exist in the asset, will NOT be deleted during deployment (create/update).
   *
   * @see https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html
   *
   * @default true
   */
  readonly prune?: boolean;
  /**
   * If this is set to "false", the destination files will be deleted when the
   * resource is deleted or the destination is updated.
   *
   * NOTICE: Configuring this to "false" might have operational implications. Please
   * visit to the package documentation referred below to make sure you fully understand those implications.
   *
   * @see https://github.com/aws/aws-cdk/tree/main/packages/%40aws-cdk/aws-s3-deployment#retain-on-delete
   * @default true - when resource is deleted/updated, files are retained
   */
  readonly retainOnDelete?: boolean;
  /**
   * The CloudFront distribution using the destination bucket as an origin.
   * Files in the distribution's edge caches will be invalidated after
   * files are uploaded to the destination bucket.
   *
   * @default - No invalidation occurs
   */
  readonly distribution?: cloudfront.IDistribution;
  /**
   * The file paths to invalidate in the CloudFront distribution.
   *
   * @default - All files under the destination bucket key prefix will be invalidated.
   */
  readonly distributionPaths?: string[];
  /**
   * The number of days that the lambda function's log events are kept in CloudWatch Logs.
   *
   * @default logs.RetentionDays.INFINITE
   */
  readonly logRetention?: logs.RetentionDays;
  /**
   * The amount of memory (in MiB) to allocate to the AWS Lambda function which
   * replicates the files from the CDK bucket to the destination bucket.
   *
   * If you are deploying large files, you will need to increase this number
   * accordingly.
   *
   * @default 128
   */
  readonly memoryLimit?: number;
  /**
   * The size of the AWS Lambda function’s /tmp directory in MiB.
   *
   * @default 512 MiB
   */
  readonly ephemeralStorageSize?: cdk.Size;
  /**
   *  Mount an EFS file system. Enable this if your assets are large and you encounter disk space errors.
   *  Enabling this option will require a VPC to be specified.
   *
   * @default - No EFS. Lambda has access only to 512MB of disk space.
   */
  readonly useEfs?: boolean;
  /**
   * Execution role associated with this function
   *
   * @default - A role is automatically created
   */
  readonly role?: iam.IRole;
  /**
   * User-defined object metadata to be set on all objects in the deployment
   * @default - No user metadata is set
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#UserMetadata
   */
  readonly metadata?: {
    [key: string]: string;
  };
  /**
   * System-defined cache-control metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly cacheControl?: CacheControl[];
  /**
   * System-defined cache-disposition metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly contentDisposition?: string;
  /**
   * System-defined content-encoding metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly contentEncoding?: string;
  /**
   * System-defined content-language metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly contentLanguage?: string;
  /**
   * System-defined content-type metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly contentType?: string;
  /**
   * System-defined expires metadata to be set on all objects in the deployment.
   * @default - The objects in the distribution will not expire.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly expires?: cdk.Expiration;
  /**
   * System-defined x-amz-server-side-encryption metadata to be set on all objects in the deployment.
   * @default - Server side encryption is not used.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly serverSideEncryption?: ServerSideEncryption;
  /**
   * System-defined x-amz-storage-class metadata to be set on all objects in the deployment.
   * @default - Default storage-class for the bucket is used.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly storageClass?: StorageClass;
  /**
   * System-defined x-amz-website-redirect-location metadata to be set on all objects in the deployment.
   * @default - No website redirection.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly websiteRedirectLocation?: string;
  /**
   * System-defined x-amz-server-side-encryption-aws-kms-key-id metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#SysMetadata
   */
  readonly serverSideEncryptionAwsKmsKeyId?: string;
  /**
   * System-defined x-amz-server-side-encryption-customer-algorithm metadata to be set on all objects in the deployment.
   * Warning: This is not a useful parameter until this bug is fixed: https://github.com/aws/aws-cdk/issues/6080
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/ServerSideEncryptionCustomerKeys.html#sse-c-how-to-programmatically-intro
   */
  readonly serverSideEncryptionCustomerAlgorithm?: string;
  /**
   * System-defined x-amz-acl metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl
   */
  readonly accessControl?: s3.BucketAccessControl;
  /**
   * The VPC network to place the deployment lambda handler in.
   * This is required if `useEfs` is set.
   *
   * @default None
   */
  readonly vpc?: ec2.IVpc;
  /**
   * Where in the VPC to place the deployment lambda handler.
   * Only used if 'vpc' is supplied.
   *
   * @default - the Vpc default strategy if not specified
   */
  readonly vpcSubnets?: ec2.SubnetSelection;
  /**
   * If set to true, uploads will precompute the value of `x-amz-content-sha256`
   * and include it in the signed S3 request headers.
   *
   * @default - `x-amz-content-sha256` will not be computed
   */
  readonly signContent?: boolean;
}

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
      distributionProps?.webAclId ?? props.webAclProps?.disable
        ? undefined
        : new CloudfrontWebAcl(this, "WebsiteAcl", props.webAclProps).webAclArn;

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

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    this.websiteBucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [this.websiteBucket.bucketArn],
        actions: ["s3:ListBucket"],
        principals: [originAccessIdentity.grantPrincipal],
      })
    );

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
          origin: new S3Origin(this.websiteBucket, {
            originAccessIdentity,
          }),
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
                props.runtimeOptions?.jsonPayload
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
