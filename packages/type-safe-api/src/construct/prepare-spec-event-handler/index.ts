/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as crypto from "crypto";
import { // eslint-disable-line
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { prepareApiSpec, PrepareApiSpecOptions } from "./prepare-spec";

/**
 * Represents an object location in an s3 bucket
 */
export interface S3Location {
  /**
   * The bucket in which the object resides
   */
  readonly bucket: string;
  /**
   * The object key
   */
  readonly key: string;
}

/**
 * Properties required to prepare the api specification with the given integrations, authorizers, etc
 */
export interface PrepareApiSpecCustomResourceProperties
  extends PrepareApiSpecOptions {
  /**
   * The location from which to read the spec to prepare
   */
  readonly inputSpecLocation: S3Location;
  /**
   * The location to write the prepared spec. Note that the key is used as a prefix and the output location will
   * include a hash.
   */
  readonly outputSpecLocation: S3Location;
}

/**
 * Cloudformation event type for custom resource
 */
interface OnEventRequest {
  /**
   * The type of cloudformation request
   */
  readonly RequestType: "Create" | "Update" | "Delete";
  /**
   * Physical resource id of the custom resource
   */
  readonly PhysicalResourceId?: string;
  /**
   * Properties for preparing the api
   */
  readonly ResourceProperties: {
    options: PrepareApiSpecCustomResourceProperties;
  };
}

/**
 * Custom resource response
 */
interface OnEventResponse {
  /**
   * Physical resource id of the custom resource
   */
  readonly PhysicalResourceId: string;
  /**
   * Status of the custom resource
   */
  readonly Status: "SUCCESS" | "FAILED";
  /**
   * Data returned by the custom resource
   */
  readonly Data?: {
    /**
     * The key for the output spec in the output bucket
     */
    readonly outputSpecKey: string;
  };
}

const s3 = new S3Client({
  customUserAgent: `aws-pdk/type-safe-api/prepare-spec`,
});

/**
 * Prepare the api spec for API Gateway
 * @param inputSpecLocation location of the specification to prepare
 * @param outputSpecLocation location to write the prepared spec to
 * @param options integrations, authorizers etc to apply
 * @return the output location of the prepared spec
 */
const prepare = async ({
  inputSpecLocation,
  outputSpecLocation,
  ...options
}: PrepareApiSpecCustomResourceProperties): Promise<S3Location> => {
  // Read the spec from the s3 input location
  const inputSpec = JSON.parse(
    await (
      await s3.send(
        new GetObjectCommand({
          Bucket: inputSpecLocation.bucket,
          Key: inputSpecLocation.key,
        })
      )
    ).Body!.transformToString("utf-8")
  );

  // Prepare the spec
  const preparedSpec = prepareApiSpec(inputSpec, options);
  const preparedSpecHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(preparedSpec))
    .digest("hex");

  const outputLocation: S3Location = {
    bucket: outputSpecLocation.bucket,
    key: `${outputSpecLocation.key}/${preparedSpecHash}.json`,
  };

  // Write the spec to the s3 output location
  await s3.send(
    new PutObjectCommand({
      Bucket: outputLocation.bucket,
      Key: outputLocation.key,
      Body: JSON.stringify(preparedSpec),
    })
  );

  return outputLocation;
};

/**
 * Due to a bug in cloudformation, primitive types are coerced into strings! Coerce them back here.
 * @see https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/1037
 */
export const ensurePrimitiveTypes = (
  options: PrepareApiSpecCustomResourceProperties
): PrepareApiSpecCustomResourceProperties => {
  const result = JSON.parse(JSON.stringify(options));

  // Handle apiKeyOptions.requiredByDefault (boolean)
  if (result.apiKeyOptions?.requiredByDefault !== undefined) {
    if (result.apiKeyOptions.requiredByDefault === "true") {
      result.apiKeyOptions.requiredByDefault = true;
    } else if (result.apiKeyOptions.requiredByDefault === "false") {
      result.apiKeyOptions.requiredByDefault = false;
    }
  }

  // Handle corsOptions.statusCode (number)
  if (result.corsOptions?.statusCode !== undefined) {
    const statusCode = Number(result.corsOptions.statusCode);
    if (!isNaN(statusCode)) {
      result.corsOptions.statusCode = statusCode;
    }
  }

  if (result.integrations) {
    for (const operationId in result.integrations) {
      const integration = result.integrations[operationId];
      // Handle integration options.apiKeyRequired (boolean)
      if (integration.options?.apiKeyRequired !== undefined) {
        if (integration.options.apiKeyRequired === "true") {
          integration.options.apiKeyRequired = true;
        } else if (integration.options.apiKeyRequired === "false") {
          integration.options.apiKeyRequired = false;
        }
      }

      // Handle timeoutInMillis (number)
      if (integration.integration?.timeoutInMillis !== undefined) {
        const timeoutInMillis = Number(integration.integration.timeoutInMillis);
        if (!isNaN(timeoutInMillis)) {
          integration.integration.timeoutInMillis = timeoutInMillis;
        }
      }

      // Handle tlsConfig.insecureSkipVerification (boolean)
      if (
        integration.integration?.tlsConfig?.insecureSkipVerification !==
        undefined
      ) {
        if (
          integration.integration.tlsConfig.insecureSkipVerification === "true"
        ) {
          integration.integration.tlsConfig.insecureSkipVerification = true;
        } else if (
          integration.integration.tlsConfig.insecureSkipVerification === "false"
        ) {
          integration.integration.tlsConfig.insecureSkipVerification = false;
        }
      }
    }
  }

  return result;
};

exports.handler = async (event: OnEventRequest): Promise<OnEventResponse> => {
  switch (event.RequestType) {
    case "Create":
    case "Update":
      // Prepare the spec on create
      const outputLocation = await prepare(
        ensurePrimitiveTypes(event.ResourceProperties.options)
      );
      return {
        PhysicalResourceId: outputLocation.key,
        Status: "SUCCESS",
        Data: {
          outputSpecKey: outputLocation.key,
        },
      };
    case "Delete":
    // Nothing to do for delete
    default:
      break;
  }

  return {
    PhysicalResourceId: event.PhysicalResourceId!,
    Status: "SUCCESS",
  };
};
