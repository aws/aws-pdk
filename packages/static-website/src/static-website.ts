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
import { RemovalPolicy } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AddBehaviorOptions,
  Distribution,
  ErrorResponse,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import {
  BucketDeployment,
  ServerSideEncryption,
  Source,
} from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { CloudfrontWebAcl } from "./cloudfront-web-acl";

const DEFAULT_RUNTIME_CONFIG_FILENAME = "runtime-config.json";

/**
 * Options for configuring the default origin behavior.
 */
export interface OriginBehaviourOptions extends AddBehaviorOptions {}

/**
 * Configuration related to using custom domain names/certificates in Cloudfront.
 */
export interface CloudfrontDomainOptions {
  /**
   * A certificate to associate with the distribution. The certificate must be located in N. Virginia (us-east-1).
   *
   * @default - the CloudFront wildcard certificate (*.cloudfront.net) will be used.
   */
  readonly certificate: ICertificate;

  /**
   * Alternative domain names for this distribution.
   *
   * If you want to use your own domain name, such as www.example.com, instead of the cloudfront.net domain name,
   * you can add an alternate domain name to your distribution. If you attach a certificate to the distribution,
   * you must add (at least one of) the domain names of the certificate to this list.
   *
   * @default - The distribution will only support the default generated name (e.g., d111111abcdef8.cloudfront.net)
   */
  readonly domainNames: string[];
}

/**
 * Configuration related to Cloudfront Logging
 */
export interface CloudfrontLoggingOptions {
  /**
   * Enable access logging for the distribution.
   *
   * @default - false, unless `logBucket` is specified.
   */
  readonly enableLogging?: boolean;

  /**
   * The Amazon S3 bucket to store the access logs in.
   *
   * @default - A bucket is created if `enableLogging` is true
   */
  readonly logBucket?: IBucket;

  /**
   * Specifies whether you want CloudFront to include cookies in access logs
   *
   * @default false
   */
  readonly logIncludesCookies?: boolean;

  /**
   * An optional string that you want CloudFront to prefix to the access log filenames for this distribution.
   *
   * @default - no prefix
   */
  readonly logFilePrefix?: string;
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
   * The object that you want CloudFront to request from your origin (for example, index.html)
   * when a viewer requests the root URL for your distribution.
   *
   * @default - index.html
   */
  readonly defaultRootObject?: string;

  /**
   * How CloudFront should handle requests that are not successful (e.g., PageNotFound).
   *
   * @default - [{httpStatus: 404,responseHttpStatus: 200,responsePagePath: '/index.html'}]
   */
  readonly errorResponses?: ErrorResponse[];

  /**
   * Dynamic configuration which gets resolved only during deployment.
   */
  readonly runtimeOptions?: RuntimeOptions;

  /**
   * Configuration related to using custom domain names/certificates.
   */
  readonly domainOptions?: CloudfrontDomainOptions;

  /**
   * Configuration related to Cloudfront Logging.
   */
  readonly loggingOptions?: CloudfrontLoggingOptions;

  /**
   * Options for configuring the default origin behavior.
   */
  readonly originBehaviourOptions?: OriginBehaviourOptions;
}

/**
 * Deploys a Static Website using a private S3 bucket as an origin and Cloudfront as the entrypoint.
 *
 * This construct configures a webAcl containing rules that are generally applicable to web applications. This
 * provides protection against exploitation of a wide range of vulnerabilities, including some of the high risk
 * and commonly occurring vulnerabilities described in OWASP publications such as OWASP Top 10.
 *
 */
export class StaticWebsite extends Construct {
  public readonly websiteBucket: Bucket;
  public readonly cloudFrontDistribution: Distribution;
  public readonly bucketDeployment: BucketDeployment;

  constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
    super(scope, id);

    const defaultRootObject = props.defaultRootObject || "index.html";
    this.validateProps(props);

    // S3 Bucket to hold website files
    this.websiteBucket = new Bucket(this, "WebsiteBucket", {
      versioned: true,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Web ACL
    const webAcl = new CloudfrontWebAcl(this, "WebsiteAcl", {
      managedRules: [{ vendor: "AWS", name: "AWSManagedRulesCommonRuleSet" }],
    });

    // Cloudfront Distribution
    this.cloudFrontDistribution = new Distribution(
      this,
      "CloudfrontDistribution",
      {
        webAclId: webAcl.webAclArn,
        defaultBehavior: {
          ...props.originBehaviourOptions,
          origin: new S3Origin(this.websiteBucket),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject,
        certificate: props.domainOptions?.certificate,
        domainNames: props.domainOptions?.domainNames,
        errorResponses: [
          {
            httpStatus: 404, // We need to redirect "key not found errors" to index.html for single page apps
            responseHttpStatus: 200,
            responsePagePath: `/${defaultRootObject}`,
          },
        ],
        enableLogging: props.loggingOptions?.enableLogging,
        logBucket: props.loggingOptions?.logBucket,
        logIncludesCookies: props.loggingOptions?.logIncludesCookies,
        logFilePrefix: props.loggingOptions?.logFilePrefix,
      }
    );

    // Deploy Website
    this.bucketDeployment = new BucketDeployment(this, "WebsiteDeployment", {
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
      serverSideEncryption: ServerSideEncryption.AES_256,
    });
  }

  private validateProps = (props: StaticWebsiteProps) => {
    props.runtimeOptions && this.validateRuntimeConfig(props.runtimeOptions);
  };

  private validateRuntimeConfig = (config: RuntimeOptions) => {
    if (!config) {
      throw new Error(
        `validateRuntimeConfig only accepts non-null RuntimeOptions.`
      );
    }

    if (config.jsonFileName && !config.jsonFileName.endsWith(".json")) {
      throw new Error(`RuntimeOptions.jsonFileName must be a json file.`);
    }
  };
}
