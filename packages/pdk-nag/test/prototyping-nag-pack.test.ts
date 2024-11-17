/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

import { SynthUtils } from "@aws-cdk/assert";
import { Aspects, CfnResource, Stack } from "aws-cdk-lib";
import { NagMessageLevel, IApplyRule } from "cdk-nag";
import { AwsPrototypingChecks } from "../src/packs/aws-prototyping";

const expectedErrors = [
  "AwsPrototyping-AutoScalingLaunchConfigPublicIpDisabled",
  "AwsPrototyping-Cloud9InstanceNoIngressSystemsManager",
  "AwsPrototyping-CloudFrontDistributionGeoRestrictions",
  "AwsPrototyping-CloudFrontDistributionS3OriginAccessIdentity",
  "AwsPrototyping-CodeBuildProjectEnvVarAwsCred",
  "AwsPrototyping-CognitoUserPoolNoUnauthenticatedLogins",
  "AwsPrototyping-CognitoUserPoolStrongPasswordPolicy",
  "AwsPrototyping-DMSReplicationNotPublic",
  "AwsPrototyping-DocumentDBCredentialsInSecretsManager",
  "AwsPrototyping-EC2InstancesInVPC",
  "AwsPrototyping-EC2RestrictedCommonPorts",
  "AwsPrototyping-EC2RestrictedInbound",
  "AwsPrototyping-EC2RestrictedSSH",
  "AwsPrototyping-ECROpenAccess",
  "AwsPrototyping-EKSClusterNoEndpointPublicAccess",
  "AwsPrototyping-ElastiCacheClusterInVPC",
  "AwsPrototyping-ElasticBeanstalkManagedUpdatesEnabled",
  "AwsPrototyping-EventBusOpenAccess",
  "AwsPrototyping-IAMPolicyNoStatementsWithAdminAccess",
  "AwsPrototyping-LambdaFunctionPublicAccessProhibited",
  "AwsPrototyping-LambdaFunctionUrlAuth",
  "AwsPrototyping-NeptuneClusterAutomaticMinorVersionUpgrade",
  "AwsPrototyping-OpenSearchInVPCOnly",
  "AwsPrototyping-OpenSearchNoUnsignedOrAnonymousAccess",
  "AwsPrototyping-RDSAutomaticMinorVersionUpgradeEnabled",
  "AwsPrototyping-RDSInstancePublicAccess",
  "AwsPrototyping-RDSRestrictedInbound",
  "AwsPrototyping-RedshiftClusterInVPC",
  "AwsPrototyping-RedshiftClusterPublicAccess",
  "AwsPrototyping-RedshiftClusterVersionUpgrade",
  "AwsPrototyping-S3BucketLevelPublicAccessProhibited",
  "AwsPrototyping-S3BucketPublicReadProhibited",
  "AwsPrototyping-S3BucketPublicWriteProhibited",
  "AwsPrototyping-S3WebBucketOAIAccess",
  "AwsPrototyping-VPCSubnetAutoAssignPublicIpDisabled",
];

const expectedWarnings = [
  "AwsPrototyping-APIGWAssociatedWithWAF",
  "AwsPrototyping-APIGWAuthorization",
  "AwsPrototyping-APIGWRequestValidation",
  "AwsPrototyping-CloudFrontDistributionHttpsViewerNoOutdatedSSL",
  "AwsPrototyping-CloudFrontDistributionNoOutdatedSSL",
  "AwsPrototyping-CloudFrontDistributionWAFIntegration",
  "AwsPrototyping-CodeBuildProjectKMSEncryptedArtifacts",
  "AwsPrototyping-CodeBuildProjectManagedImages",
  "AwsPrototyping-CognitoUserPoolAdvancedSecurityModeEnforced",
  "AwsPrototyping-CognitoUserPoolAPIGWAuthorizer",
  "AwsPrototyping-CognitoUserPoolMFA",
  "AwsPrototyping-DocumentDBClusterEncryptionAtRest",
  "AwsPrototyping-DocumentDBClusterNonDefaultPort",
  "AwsPrototyping-DAXEncrypted",
  "AwsPrototyping-EC2EBSVolumeEncrypted",
  "AwsPrototyping-EC2InstanceNoPublicIp",
  "AwsPrototyping-EC2InstanceProfileAttached",
  "AwsPrototyping-EC2SecurityGroupDescription",
  "AwsPrototyping-ECSTaskDefinitionContainerLogging",
  "AwsPrototyping-ECSTaskDefinitionNoEnvironmentVariables",
  "AwsPrototyping-EFSEncrypted",
  "AwsPrototyping-EKSClusterControlPlaneLogs",
  "AwsPrototyping-ElastiCacheClusterNonDefaultPort",
  "AwsPrototyping-ElastiCacheRedisClusterEncryption",
  "AwsPrototyping-ElastiCacheRedisClusterRedisAuth",
  "AwsPrototyping-ElasticBeanstalkEC2InstanceLogsToS3",
  "AwsPrototyping-ElasticBeanstalkVPCSpecified",
  "AwsPrototyping-ALBHttpToHttpsRedirection",
  "AwsPrototyping-ELBTlsHttpsListenersOnly",
  "AwsPrototyping-EMRAuthEC2KeyPairOrKerberos",
  "AwsPrototyping-EMREncryptionInTransit",
  "AwsPrototyping-EMRLocalDiskEncryption",
  "AwsPrototyping-GlueEncryptedCloudWatchLogs",
  "AwsPrototyping-GlueJobBookmarkEncrypted",
  "AwsPrototyping-IAMNoManagedPolicies",
  "AwsPrototyping-IAMNoWildcardPermissions",
  "AwsPrototyping-IAMPolicyNoStatementsWithFullAccess",
  "AwsPrototyping-KinesisDataFirehoseSSE",
  "AwsPrototyping-KinesisDataStreamDefaultKeyWhenSSE",
  "AwsPrototyping-KinesisDataStreamSSE",
  "AwsPrototyping-KMSBackingKeyRotationEnabled",
  "AwsPrototyping-LambdaLatestVersion",
  "AwsPrototyping-MediaStoreContainerCORSPolicy",
  "AwsPrototyping-MediaStoreContainerHasContainerPolicy",
  "AwsPrototyping-MediaStoreContainerSSLRequestsOnly",
  "AwsPrototyping-MSKBrokerToBrokerTLS",
  "AwsPrototyping-MSKClientToBrokerTLS",
  "AwsPrototyping-NeptuneClusterEncryptionAtRest",
  "AwsPrototyping-NeptuneClusterIAMAuth",
  "AwsPrototyping-OpenSearchAllowlistedIPs",
  "AwsPrototyping-OpenSearchEncryptedAtRest",
  "AwsPrototyping-OpenSearchNodeToNodeEncryption",
  "AwsPrototyping-QuicksightSSLConnections",
  "AwsPrototyping-AuroraMySQLPostgresIAMAuth",
  "AwsPrototyping-RDSNonDefaultPort",
  "AwsPrototyping-RDSStorageEncrypted",
  "AwsPrototyping-RedshiftClusterEncryptionAtRest",
  "AwsPrototyping-RedshiftClusterNonDefaultPort",
  "AwsPrototyping-RedshiftClusterNonDefaultUsername",
  "AwsPrototyping-RedshiftRequireTlsSSL",
  "AwsPrototyping-S3BucketLoggingEnabled",
  "AwsPrototyping-S3BucketSSLRequestsOnly",
  "AwsPrototyping-SageMakerNotebookInstanceKMSKeyConfigured",
  "AwsPrototyping-SageMakerNotebookInVPC",
  "AwsPrototyping-SageMakerNotebookNoDirectInternetAccess",
  "AwsPrototyping-SecretsManagerRotationEnabled",
  "AwsPrototyping-SNSTopicSSLPublishOnly",
  "AwsPrototyping-SQSQueueSSE",
  "AwsPrototyping-SQSQueueSSLRequestsOnly",
  "AwsPrototyping-TimestreamDatabaseCustomerManagedKey",
  "AwsPrototyping-VPCNoNACLs",
];

describe("Check NagPack Details", () => {
  describe("AwsPrototyping-CDK", () => {
    class AwsPrototypingChecksExtended extends AwsPrototypingChecks {
      actualWarnings = new Array<string>();
      actualErrors = new Array<string>();
      applyRule(params: IApplyRule): void {
        const ruleSuffix = params.ruleSuffixOverride
          ? params.ruleSuffixOverride
          : params.rule.name;
        const ruleId = `${pack.readPackName}-${ruleSuffix}`;
        if (params.level === NagMessageLevel.WARN) {
          this.actualWarnings.push(ruleId);
        } else {
          this.actualErrors.push(ruleId);
        }
      }
    }
    const pack = new AwsPrototypingChecksExtended();
    test("Pack Name is correct", () => {
      expect(pack.readPackName).toStrictEqual("AwsPrototyping");
    });

    test("Pack contains expected warning and error rules", () => {
      jest.spyOn(pack, "applyRule");
      const stack = new Stack();
      Aspects.of(stack).add(pack);
      new CfnResource(stack, "rTestResource", { type: "foo" });
      SynthUtils.synthesize(stack).messages;
      expect(pack.actualWarnings.sort()).toEqual(expectedWarnings.sort());
      expect(pack.actualErrors.sort()).toEqual(expectedErrors.sort());
    });
  });
});
