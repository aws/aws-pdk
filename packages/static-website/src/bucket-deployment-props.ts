/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  aws_cloudfront,
  aws_ec2,
  aws_iam,
  aws_logs,
  aws_s3,
  aws_s3_deployment,
  Expiration,
  Size,
} from "aws-cdk-lib";

/**
 * BucketDeploymentProps
 */
export interface BucketDeploymentProps {
  /**
   * System-defined x-amz-website-redirect-location metadata to be set on all objects in the deployment.
   * @default - No website redirection.
   * @stability stable
   */
  readonly websiteRedirectLocation?: string;
  /**
   * Where in the VPC to place the deployment lambda handler.
   * Only used if 'vpc' is supplied.
   * @default - the Vpc default strategy if not specified
   * @stability stable
   */
  readonly vpcSubnets?: aws_ec2.SubnetSelection;
  /**
   * The VPC network to place the deployment lambda handler in.
   * This is required if `useEfs` is set.
   * @default None
   * @stability stable
   */
  readonly vpc?: aws_ec2.IVpc;
  /**
   * Mount an EFS file system.
   * Enable this if your assets are large and you encounter disk space errors.
   * Enabling this option will require a VPC to be specified.
   * @default - No EFS. Lambda has access only to 512MB of disk space.
   * @stability stable
   */
  readonly useEfs?: boolean;
  /**
   * System-defined x-amz-storage-class metadata to be set on all objects in the deployment.
   * @default - Default storage-class for the bucket is used.
   * @stability stable
   */
  readonly storageClass?: aws_s3_deployment.StorageClass;
  /**
   * If set to true, uploads will precompute the value of `x-amz-content-sha256` and include it in the signed S3 request headers.
   * @default - `x-amz-content-sha256` will not be computed
   * @stability stable
   */
  readonly signContent?: boolean;
  /**
   * System-defined x-amz-server-side-encryption-customer-algorithm metadata to be set on all objects in the deployment.
   * Warning: This is not a useful parameter until this bug is fixed: https://github.com/aws/aws-cdk/issues/6080
   * @default - Not set.
   * @stability stable
   */
  readonly serverSideEncryptionCustomerAlgorithm?: string;
  /**
   * System-defined x-amz-server-side-encryption-aws-kms-key-id metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @stability stable
   */
  readonly serverSideEncryptionAwsKmsKeyId?: string;
  /**
   * System-defined x-amz-server-side-encryption metadata to be set on all objects in the deployment.
   * @default - Server side encryption is not used.
   * @stability stable
   */
  readonly serverSideEncryption?: aws_s3_deployment.ServerSideEncryption;
  /**
   * Execution role associated with this function.
   * @default - A role is automatically created
   * @stability stable
   */
  readonly role?: aws_iam.IRole;
  /**
   * If this is set to "false", the destination files will be deleted when the resource is deleted or the destination is updated.
   * NOTICE: Configuring this to "false" might have operational implications. Please
   * visit to the package documentation referred below to make sure you fully understand those implications.
   * @default true - when resource is deleted/updated, files are retained
   * @stability stable
   */
  readonly retainOnDelete?: boolean;
  /**
   * If this is set to false, files in the destination bucket that do not exist in the asset, will NOT be deleted during deployment (create/update).
   * @default true
   * @stability stable
   */
  readonly prune?: boolean;
  /**
   * User-defined object metadata to be set on all objects in the deployment.
   * @default - No user metadata is set
   * @stability stable
   */
  readonly metadata?: Record<string, string>;
  /**
   * The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket.
   * If you are deploying large files, you will need to increase this number
   * accordingly.
   * @default 128
   * @stability stable
   */
  readonly memoryLimit?: number;
  /**
   * The number of days that the lambda function's log events are kept in CloudWatch Logs.
   * @default logs.RetentionDays.INFINITE
   * @stability stable
   */
  readonly logRetention?: aws_logs.RetentionDays;
  /**
   * If this is set, matching files or objects will be included with the deployment's sync command.
   * Since all files from the deployment package are included by default, this property
   * is usually leveraged alongside an `exclude` filter.
   * @default - No include filters are used and all files are included with the sync command
   * @stability stable
   */
  readonly include?: Array<string>;
  /**
   * If this is set, the zip file will be synced to the destination S3 bucket and extracted.
   * If false, the file will remain zipped in the destination bucket.
   * @default true
   * @stability stable
   */
  readonly extract?: boolean;
  /**
   * System-defined expires metadata to be set on all objects in the deployment.
   * @default - The objects in the distribution will not expire.
   * @stability stable
   */
  readonly expires?: Expiration;
  /**
   * If this is set, matching files or objects will be excluded from the deployment's sync command.
   * This can be used to exclude a file from being pruned in the destination bucket.
   *
   * If you want to just exclude files from the deployment package (which excludes these files
   * evaluated when invalidating the asset), you should leverage the `exclude` property of
   * `AssetOptions` when defining your source.
   * @default - No exclude filters are used
   * @stability stable
   */
  readonly exclude?: Array<string>;
  /**
   * The size of the AWS Lambda function’s /tmp directory in MiB.
   * @default 512 MiB
   * @stability stable
   */
  readonly ephemeralStorageSize?: Size;
  /**
   * The file paths to invalidate in the CloudFront distribution.
   * @default - All files under the destination bucket key prefix will be invalidated.
   * @stability stable
   */
  readonly distributionPaths?: Array<string>;
  /**
   * The CloudFront distribution using the destination bucket as an origin.
   * Files in the distribution's edge caches will be invalidated after
   * files are uploaded to the destination bucket.
   * @default - No invalidation occurs
   * @stability stable
   */
  readonly distribution?: aws_cloudfront.IDistribution;
  /**
   * Key prefix in the destination bucket.
   * Must be <=104 characters
   * @default "/" (unzip to root of the destination bucket)
   * @stability stable
   */
  readonly destinationKeyPrefix?: string;
  /**
   * System-defined content-type metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @stability stable
   */
  readonly contentType?: string;
  /**
   * System-defined content-language metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @stability stable
   */
  readonly contentLanguage?: string;
  /**
   * System-defined content-encoding metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @stability stable
   */
  readonly contentEncoding?: string;
  /**
   * System-defined cache-disposition metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @stability stable
   */
  readonly contentDisposition?: string;
  /**
   * System-defined cache-control metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @stability stable
   */
  readonly cacheControl?: Array<aws_s3_deployment.CacheControl>;
  /**
   * System-defined x-amz-acl metadata to be set on all objects in the deployment.
   * @default - Not set.
   * @stability stable
   */
  readonly accessControl?: aws_s3.BucketAccessControl;
  /**
   * The sources from which to deploy the contents of this bucket.
   * @stability stable
   */
  readonly sources?: Array<aws_s3_deployment.ISource>;
  /**
   * The S3 bucket to sync the contents of the zip file to.
   * @stability stable
   */
  readonly destinationBucket?: aws_s3.IBucket;
}
