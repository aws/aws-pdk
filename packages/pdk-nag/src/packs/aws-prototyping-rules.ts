/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NagMessageLevel, rules } from "cdk-nag";

/**
 * Pack name
 *
 */
export let PackName = "AwsPrototyping";

/**
 * Rule metadata
 *
 */
export let RuleMetadata = [
  {
    info: "The REST API stage is not associated with AWS WAFv2 web ACL.",
    explanation:
      "AWS WAFv2 is a web application firewall that helps protect web applications and APIs from attacks by allowing configured rules to allow, block, or monitor (count) web requests based on customizable rules and conditions that are defined.",
    level: NagMessageLevel.WARN,
    rule: rules.apigw.APIGWAssociatedWithWAF,
  },
  {
    info: "The API does not implement authorization.",
    explanation:
      "In most cases an API needs to have an authentication and authorization implementation strategy. This includes using such approaches as IAM, Cognito User Pools, Custom authorizer, etc.\n\nExample threat: An actor with a network path to an API gateway stage end-point can interact with the API method in question without authorization, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.WARN,
    rule: rules.apigw.APIGWAuthorization,
  },
  {
    info: "The REST API does not have request validation enabled.",
    explanation:
      "The API should have basic request validation enabled. If the API is integrated with a custom source (Lambda, ECS, etc..) in the backend, deeper input validation should be considered for implementation.",
    level: NagMessageLevel.WARN,
    rule: rules.apigw.APIGWRequestValidation,
  },
  {
    info: "The Athena workgroup does not encrypt query results.",
    explanation:
      "Encrypting query results stored in S3 helps secure data to meet compliance requirements for data-at-rest encryption.",
    level: NagMessageLevel.WARN,
    rule: rules.athena.AthenaWorkgroupEncryptedQueryResults,
  },
  {
    info: "The Auto Scaling launch configuration does not have public IP addresses disabled.",
    explanation:
      "If you configure your Network Interfaces with a public IP address, then the associated resources to those Network Interfaces are reachable from the internet. EC2 resources should not be publicly accessible, as this may allow unintended access to your applications or servers.\n\nExample threat: A global internet-based actor can discover EC2 instances that have public IP addresses, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.autoscaling.AutoScalingLaunchConfigPublicIpDisabled,
  },
  {
    info: "The Cloud9 instance does not use a no-ingress EC2 instance with AWS Systems Manager.",
    explanation:
      "SSM adds an additional layer of protection as it allows operators to control access through IAM permissions and does not require opening inbound ports.\n\nExample threat: A global internet-based actor can discover Cloud9 EC2 instances that have public IP addresses and that are exposing SSH, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.cloud9.Cloud9InstanceNoIngressSystemsManager,
  },
  {
    info: "The prototypes CloudFront distribution has not been configured with geographic restrictions (GeoRestriction)",
    explanation:
      "Geo restriction should be enabled for the distribution in order to limit the surface area exposed to expected geographies\n\nExample threat: A global internet-based actor can discover prototype web assets that are exposed via CloudFront distributions, which may lead to recon and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.cloudfront.CloudFrontDistributionGeoRestrictions,
  },
  {
    info: "The CloudFront distribution allows for SSLv3 or TLSv1 for HTTPS viewer connections.",
    explanation:
      "Vulnerabilities have been and continue to be discovered in the deprecated SSL and TLS protocols. Help protect viewer connections by specifying a viewer certificate that enforces a minimum of TLSv1.1 or TLSv1.2 in the security policy. Distributions that use that use the default CloudFront viewer certificate or use 'vip' for the SslSupportMethod are non-compliant with this rule, as the minimum security policy is set to TLSv1 regardless of the specified MinimumProtocolVersion",
    level: NagMessageLevel.WARN,
    rule: rules.cloudfront.CloudFrontDistributionHttpsViewerNoOutdatedSSL,
  },
  {
    info: "The CloudFront distributions uses SSLv3 or TLSv1 for communication to the origin.",
    explanation:
      "Vulnerabilities have been and continue to be discovered in the deprecated SSL and TLS protocols. Using a security policy with minimum TLSv1.1 or TLSv1.2 and appropriate security ciphers for HTTPS helps protect viewer connections.",
    level: NagMessageLevel.WARN,
    rule: rules.cloudfront.CloudFrontDistributionNoOutdatedSSL,
  },
  {
    info: "The CloudFront distribution does not use an origin access identity an S3 origin.",
    explanation:
      "Origin access identities help with security by restricting any direct access to objects through S3 URLs.\n\nExample threat: A global internet-based actor can bypass the CloudFront distribution and associated controls (e.g. geo blocking), which may lead to direct access to static assets hosted on the S3 origin possibly impacting the confidentiality, integrity and availability of the data assets hosted on the S3 origin for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.cloudfront.CloudFrontDistributionS3OriginAccessIdentity,
  },
  {
    info: "The CloudFront distribution may require integration with AWS WAF.",
    explanation:
      "The Web Application Firewall can help protect against application-layer attacks that can compromise the security of the system or place unnecessary load on them.",
    level: NagMessageLevel.WARN,
    rule: rules.cloudfront.CloudFrontDistributionWAFIntegration,
  },
  {
    info: "The CodeBuild environment stores sensitive credentials (such as AWS_ACCESS_KEY_ID and/or AWS_SECRET_ACCESS_KEY) as plaintext environment variables.",
    explanation:
      "Do not store these variables in clear text. Storing these variables in clear text leads to unintended data exposure and unauthorized access.\n\nExample threat: An actor who can view the CodeBuild environment variables can obtain the AWS Access Key and Secret Access Key, which may lead to the actor being able to do anything the AWS keys are authorised to do possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.codebuild.CodeBuildProjectEnvVarAwsCred,
  },
  {
    info: "The CodeBuild project does not use an AWS KMS key for encryption.",
    explanation:
      "Using an AWS KMS key helps follow the standard security advice of granting least privilege to objects generated by the project.",
    level: NagMessageLevel.WARN,
    rule: rules.codebuild.CodeBuildProjectKMSEncryptedArtifacts,
  },
  {
    info: "The CodeBuild project does not use images provided by the CodeBuild service or have a cdk-nag suppression rule explaining the need for a custom image.",
    explanation:
      "Explaining differences/edits to Docker images helps operators better understand system dependencies.",
    level: NagMessageLevel.WARN,
    rule: rules.codebuild.CodeBuildProjectManagedImages,
  },
  {
    info: "The CodeBuild project has privileged mode enabled.",
    explanation:
      "Privileged grants elevated rights to the system, which introduces additional risk. Privileged mode should only be set to true only if the build project is used to build Docker images. Otherwise, a build that attempts to interact with the Docker daemon fails.",
    level: NagMessageLevel.WARN,
    rule: rules.codebuild.CodeBuildProjectPrivilegedModeDisabled,
  },
  {
    info: "The Cognito user pool does not have AdvancedSecurityMode set to ENFORCED.",
    explanation:
      "Advanced security features enable the system to detect and act upon malicious sign-in attempts.",
    level: NagMessageLevel.WARN,
    rule: rules.cognito.CognitoUserPoolAdvancedSecurityModeEnforced,
  },
  {
    info: "The API Gateway method does not use a Cognito user pool authorizer.",
    explanation:
      "API Gateway validates the tokens from a successful user pool authentication, and uses them to grant your users access to resources including Lambda functions, or your own API.",
    level: NagMessageLevel.WARN,
    rule: rules.cognito.CognitoUserPoolAPIGWAuthorizer,
  },
  {
    info: "The Cognito user pool is not configured to require MFA.",
    explanation:
      "Multi-factor authentication (MFA) increases security for the application by adding another authentication method, and not relying solely on user name and password.",
    level: NagMessageLevel.WARN,
    rule: rules.cognito.CognitoUserPoolMFA,
  },
  {
    info: "The Cognito identity pool allows for unauthenticated logins and does not have a cdk-nag rule suppression with a reason.",
    explanation:
      "Applications do not warrant unauthenticated guest access in many cases. Metadata explaining the use case allows for transparency to operators.\n\nExample threat: A global internet-based actor who has discovered a prototype endpoint with Cognito unauthenticated logins can does not need to provide credentials to interact with the endpoint, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.cognito.CognitoUserPoolNoUnauthenticatedLogins,
  },
  {
    info: "The Cognito user pool does not have a password policy that minimally specify a password length of at least 8 characters, as well as requiring uppercase, numeric, and special characters.",
    explanation:
      "Strong password policies increase system security by encouraging users to create reliable and secure passwords.\n\nExample threat: An actor who has discovered a prototype endpoint with Cognito authenticated logins can perform a dictionary or brute force attack to authenticate as an authorized Cognito user, which may lead to the actor being able to do anything the associated Cognito user is authorised to do possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.cognito.CognitoUserPoolStrongPasswordPolicy,
  },
  {
    info: "The DMS replication instance is public.",
    explanation:
      "DMS replication instances can contain sensitive information and access control is required for such accounts.\n\nExample threat: A global internet-based actor can discover DMS instances that have public IP addresses, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.dms.DMSReplicationNotPublic,
  },
  {
    info: "The Document DB cluster does not have encryption at rest enabled.",
    explanation:
      "Encrypting data-at-rest protects data confidentiality and prevents unauthorized users from accessing sensitive information.",
    level: NagMessageLevel.WARN,
    rule: rules.documentdb.DocumentDBClusterEncryptionAtRest,
  },
  {
    info: "The Document DB cluster uses the default endpoint port.",
    explanation:
      "Port obfuscation (using a non default endpoint port) adds an additional layer of defense against non-targeted attacks (i.e. MongoDB port 27017).",
    level: NagMessageLevel.WARN,
    rule: rules.documentdb.DocumentDBClusterNonDefaultPort,
  },
  {
    info: "The Document DB cluster does not have the username and password stored in Secrets Manager.",
    explanation:
      "Secrets Manager enables operators to replace hardcoded credentials in your code, including passwords, with an API call to Secrets Manager to retrieve the secret programmatically. This helps ensure the secret can't be compromised by someone examining system code, because the secret no longer exists in the code. Also, operators can configure Secrets Manager to automatically rotate the secret for you according to a specified schedule. This enables you to replace long-term secrets with short-term ones, significantly reducing the risk of compromise.\n\nExample threat: An actor who can view the DocumentDB configuration can obtain the username and password for the DocumentDB cluster, which may lead to the actor being able to access anything the associated DocumentDB user is authorised to do possibly impacting the confidentiality, integrity and availability of the data assets hosted on the DocumentDB cluster for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.documentdb.DocumentDBCredentialsInSecretsManager,
  },
  {
    info: "The DAX cluster does not have server-side encryption enabled.",
    explanation:
      "Data in cache, configuration data and log files should be encrypted using Server-Side Encryption in order to protect from unauthorized access to the underlying storage.",
    level: NagMessageLevel.WARN,
    rule: rules.dynamodb.DAXEncrypted,
  },
  {
    info: "The EBS volume has encryption disabled.",
    explanation:
      "With EBS encryption, you aren't required to build, maintain, and secure your own key management infrastructure. EBS encryption uses KMS keys when creating encrypted volumes and snapshots. This helps protect data at rest.",
    level: NagMessageLevel.WARN,
    rule: rules.ec2.EC2EBSVolumeEncrypted,
  },
  {
    info: "The EC2 instance is associated with a public IP address.",
    explanation:
      "Amazon EC2 instances can contain sensitive information and access control is required for such resources.",
    level: NagMessageLevel.WARN,
    rule: rules.ec2.EC2InstanceNoPublicIp,
  },
  {
    info: "The EC2 instance does not have an instance profile attached.",
    explanation:
      "EC2 instance profiles pass an IAM role to an EC2 instance. Attaching an instance profile to your instances can assist with least privilege and permissions management.",
    level: NagMessageLevel.WARN,
    rule: rules.ec2.EC2InstanceProfileAttached,
  },
  {
    info: "The EC2 instance is not within a VPC.",
    explanation:
      "Because of their logical isolation, domains that reside within an Amazon VPC have an extra layer of security when compared to domains that use public endpoints.\n\nExample threat: A global internet-based actor can discover EC2 instances that have public IP addresses, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.ec2.EC2InstancesInVPC,
  },
  {
    info: "The EC2 instance allows unrestricted inbound IPv4 TCP traffic on one or more common ports (by default these ports include 20, 21, 3389, 3309, 3306, 4333).",
    explanation:
      "Not restricting access to ports to trusted sources can lead to attacks against the availability, integrity and confidentiality of systems. By default, common ports which should be restricted include port numbers 20, 21, 3389, 3306, and 4333.\n\nExample threat: A global internet-based actor can discover exposed services (e.g. Telnet, SSH, RDS, MySQL) using their common port numbers, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.ec2.EC2RestrictedCommonPorts,
  },
  {
    info: "The Security Group allows for 0.0.0.0/0 or ::/0 inbound access.",
    explanation:
      "Large port ranges, when open, expose instances to unwanted attacks. More than that, they make traceability of vulnerabilities very difficult. For instance, your web servers may only require 80 and 443 ports to be open, but not all. One of the most common mistakes observed is when all ports for 0.0.0.0/0 range are open in a rush to access the instance. EC2 instances must expose only to those ports enabled on the corresponding security group level.\n\nExample threat: A global internet-based actor can discover EC2 instances that have public IP addresses and allow ingress to all internet address or move laterally to non-public EC2 instances, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.ec2.EC2RestrictedInbound,
  },
  {
    info: "The Security Group allows unrestricted SSH access.",
    explanation:
      "Not allowing ingress (or remote) traffic from 0.0.0.0/0 or ::/0 to port 22 on your resources helps to restrict remote access.\n\nExample threat: A global internet-based actor can discover EC2 instances that have public IP addresses and allow ingress to all internet address to SSH or move laterally to non-public EC2 instances via SSH, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.ec2.EC2RestrictedSSH,
  },
  {
    info: "The Security Group does not have a description.",
    explanation:
      "Descriptions help simplify operations and remove any opportunities for operator errors.",
    level: NagMessageLevel.WARN,
    rule: rules.ec2.EC2SecurityGroupDescription,
  },
  {
    info: "The ECR Repository allows open access.",
    explanation:
      "Removing * principals in an ECR Repository helps protect against unauthorized access.\n\nExample threat: A global internet-based actor who has discovered a ECR repository can access the container images hosted within the repository, which may lead to information disclosure that aids in the intrusion activities being successful against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.ecr.ECROpenAccess,
  },
  {
    info: "One or more containers in the ECS Task Definition do not have container logging enabled.",
    explanation:
      "Container logging allows operators to view and aggregate the logs from the container. Containers should use the 'awslogs' driver at a minimum.",
    level: NagMessageLevel.WARN,
    rule: rules.ecs.ECSTaskDefinitionContainerLogging,
  },
  {
    info: "The ECS Task Definition includes a container definition that directly specifies environment variables.",
    explanation:
      "Use secrets to inject environment variables during container startup from AWS Systems Manager Parameter Store or Secrets Manager instead of directly specifying plaintext environment variables. Updates to direct environment variables require operators to change task definitions and perform new deployments.",
    level: NagMessageLevel.WARN,
    rule: rules.ecs.ECSTaskDefinitionNoEnvironmentVariables,
  },
  {
    info: "The EFS does not have encryption at rest enabled.",
    explanation:
      "Because sensitive data can exist and to help protect data at rest, ensure encryption is enabled for your Amazon Elastic File System (EFS).",
    level: NagMessageLevel.WARN,
    rule: rules.efs.EFSEncrypted,
  },
  {
    info: "The EKS Cluster does not publish 'api', 'audit', 'authenticator, 'controllerManager', and 'scheduler' control plane logs.",
    explanation:
      "EKS control plane logging provides audit and diagnostic logs directly from the Amazon EKS control plane to CloudWatch Logs in your account. These logs make it easy for you to secure and run your clusters. This is a granular rule that returns individual findings that can be suppressed with appliesTo. The findings are in the format LogExport::<log> for exported logs. Example: appliesTo: ['LogExport::authenticate'].",
    level: NagMessageLevel.WARN,
    rule: rules.eks.EKSClusterControlPlaneLogs,
  },
  {
    info: "The EKS cluster's Kubernetes API server endpoint has public access enabled.",
    explanation:
      "A cluster's Kubernetes API server endpoint should not be publicly accessible from the Internet in order to avoid exposing private data and minimizing security risks. The API server endpoints should only be accessible from within a AWS Virtual Private Cloud (VPC).\n\nExample threat: A global internet-based actor who has discovered a EKS cluster Kubernetes API server endpoint can perform reconnaissance and intrusion activities against the exposed attack surface, which may lead to possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.eks.EKSClusterNoEndpointPublicAccess,
  },
  {
    info: "The ElastiCache cluster is not provisioned in a VPC.",
    explanation:
      "Provisioning the cluster within a VPC allows for better flexibility and control over the cache clusters security, availability, traffic routing and more.\n\nExample threat: A global internet-based actor can discover the ElastiCache cluster that have public IP addresses, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data with the cluster used within the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.elasticache.ElastiCacheClusterInVPC,
  },
  {
    info: "The ElastiCache cluster uses the default endpoint port.",
    explanation:
      "Port obfuscation (using a non default endpoint port) adds an additional layer of defense against non-targeted attacks (i.e. Redis port 6379 and Memcached port 11211).",
    level: NagMessageLevel.WARN,
    rule: rules.elasticache.ElastiCacheClusterNonDefaultPort,
  },
  {
    info: "The ElastiCache Redis cluster does not have both encryption in transit and at rest enabled.",
    explanation:
      "Encryption in transit helps secure communications to the cluster. Encryption at rest helps protect data at rest from unauthorized access.",
    level: NagMessageLevel.WARN,
    rule: rules.elasticache.ElastiCacheRedisClusterEncryption,
  },
  {
    info: "The ElastiCache Redis cluster does not use Redis AUTH for user authentication.",
    explanation:
      "Redis authentication tokens enable Redis to require a token (password) before allowing clients to execute commands, thereby improving data security.",
    level: NagMessageLevel.WARN,
    rule: rules.elasticache.ElastiCacheRedisClusterRedisAuth,
  },
  {
    info: "The Elastic Beanstalk environment does not upload EC2 Instance logs to S3.",
    explanation:
      "Beanstalk environment logs should be retained and uploaded to Amazon S3 in order to keep the logging data for future audits, historical purposes or to track and analyze the EB application environment behavior for a long period of time.",
    level: NagMessageLevel.WARN,
    rule: rules.elasticbeanstalk.ElasticBeanstalkEC2InstanceLogsToS3,
  },
  {
    info: "The Elastic Beanstalk environment does not have managed updates enabled.",
    explanation:
      "Enable managed platform updates for beanstalk environments in order to receive bug fixes, software updates and new features. Managed platform updates perform immutable environment updates.\n\nExample threat: An actor with a network path to the Elastic Beanstalk environment can attempt to take advantage of a known vulnerability in a platform component used by Elastic Beanstalk, which may lead to unknown impacts possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.elasticbeanstalk.ElasticBeanstalkManagedUpdatesEnabled,
  },
  {
    info: "The Elastic Beanstalk environment is not configured to use a specific VPC.",
    explanation:
      "Use a non-default VPC in order to separate your environment from default resources.",
    level: NagMessageLevel.WARN,
    rule: rules.elasticbeanstalk.ElasticBeanstalkVPCSpecified,
  },
  {
    info: "The ALB's HTTP listeners are not configured to redirect to HTTPS.",
    explanation:
      "To help protect data in transit, ensure that your Application Load Balancer automatically redirects unencrypted HTTP requests to HTTPS. Because sensitive data can exist, enable encryption in transit to help protect that data.",
    level: NagMessageLevel.WARN,
    rule: rules.elb.ALBHttpToHttpsRedirection,
  },
  {
    info: "The CLB does not restrict its listeners to only the SSL and HTTPS protocols.",
    explanation:
      "Ensure that your Classic Load Balancers (CLBs) are configured with SSL or HTTPS listeners. Because sensitive data can exist, enable encryption in transit to help protect that data.",
    level: NagMessageLevel.WARN,
    rule: rules.elb.ELBTlsHttpsListenersOnly,
  },
  {
    info: "The EMR cluster does not implement authentication via an EC2 Key Pair or Kerberos.",
    explanation:
      "SSH clients can use an EC2 key pair to authenticate to cluster instances. Alternatively, with EMR release version 5.10.0 or later, solutions can configure Kerberos to authenticate users and SSH connections to the master node.",
    level: NagMessageLevel.WARN,
    rule: rules.emr.EMRAuthEC2KeyPairOrKerberos,
  },
  {
    info: "The EMR cluster does not use a security configuration with encryption in transit enabled and configured.",
    explanation:
      "EMR Clusters should have a method for encrypting data in transit using Transport Layer Security (TLS).",
    level: NagMessageLevel.WARN,
    rule: rules.emr.EMREncryptionInTransit,
  },
  {
    info: "The EMR cluster does not use a security configuration with local disk encryption enabled.",
    explanation:
      "Local disk encryption uses a combination of open-source HDFS encryption and LUKS encryption to secure data at rest.",
    level: NagMessageLevel.WARN,
    rule: rules.emr.EMRLocalDiskEncryption,
  },
  {
    info: "The event bus policy allows for open access.",
    explanation:
      'An open policy ("*" principal without a condition) grants anonymous access to an event bus. Use a condition to limit the permission to accounts that fulfill a certain requirement, such as being a member of a certain AWS organization.\n\nExample threat: A global internet-based actor who has discovered the Event Bridge event bus (e.g. Endpoint ID) can put arbitrary events onto the bus, which may lead to which could be processed by the prototype possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype',
    level: NagMessageLevel.ERROR,
    rule: rules.eventbridge.EventBusOpenAccess,
  },
  {
    info: "The Glue crawler or job does not use a security configuration with CloudWatch Log encryption enabled.",
    explanation:
      "Enabling encryption at rest helps prevent unauthorized users from getting access to the logging data published to CloudWatch Logs.",
    level: NagMessageLevel.WARN,
    rule: rules.glue.GlueEncryptedCloudWatchLogs,
  },
  {
    info: "The Glue job does not have use a security configuration with job bookmark encryption enabled.",
    explanation:
      "Job bookmark encryption encrypts bookmark data before it is sent to Amazon S3 for storage.",
    level: NagMessageLevel.WARN,
    rule: rules.glue.GlueJobBookmarkEncrypted,
  },
  {
    info: "The IAM user, role, or group uses AWS managed policies.",
    explanation:
      "An AWS managed policy is a standalone policy that is created and administered by AWS. Currently, many AWS managed policies do not restrict resource scope. Replace AWS managed policies with system specific (customer) managed policies. This is a granular rule that returns individual findings that can be suppressed with appliesTo. The findings are in the format Policy::<policy> for AWS managed policies. Example: appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/foo'].",
    level: NagMessageLevel.WARN,
    rule: rules.iam.IAMNoManagedPolicies,
  },
  {
    info: "The IAM entity contains wildcard permissions and does not have a cdk-nag rule suppression with evidence for those permission.",
    explanation:
      "Metadata explaining the evidence (e.g. via supporting links) for wildcard permissions allows for transparency to operators. This is a granular rule that returns individual findings that can be suppressed with appliesTo. The findings are in the format Action::<action> for policy actions and Resource::<resource> for resources. Example: appliesTo: ['Action::s3:*'].",
    level: NagMessageLevel.WARN,
    rule: rules.iam.IAMNoWildcardPermissions,
  },
  {
    info: "The IAM policy grants admin access - meaning the policy allows a principal to perform unlimited actions on any service",
    explanation:
      "AWS Identity and Access Management (IAM) can help you incorporate the principles of least privilege and separation of duties with access permissions and authorizations, by ensuring that IAM groups have at least one IAM user. Placing IAM users in groups based on their associated permissions or job function is one way to incorporate least privilege.\n\nExample threat: A global internet-based actor who has successfully obtained valid keys or a session associated of the IAM Principal associated with the IAM policy can perform unlimited AWS actions on any AWS service which are exposed via the AWS API/Management Console/CLI, which may lead to broad and unknown impacts possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.iam.IAMPolicyNoStatementsWithAdminAccess,
  },
  {
    info: "The IAM policy grants full access - meaning the policy allows unlimited actions for a given AWS service",
    explanation:
      "Ensure IAM Actions are restricted to only those actions that are needed. Allowing users to have more privileges than needed to complete a task may violate the principle of least privilege and separation of duties.",
    level: NagMessageLevel.WARN,
    rule: rules.iam.IAMPolicyNoStatementsWithFullAccess,
  },
  {
    info: "The Kinesis Data Firehose delivery stream does not have server-side encryption enabled.",
    explanation:
      "Enabling encryption allows the system to meet strict regulatory requirements and enhance the security of system data.",
    level: NagMessageLevel.WARN,
    rule: rules.kinesis.KinesisDataFirehoseSSE,
  },
  {
    info: 'The Kinesis Data Stream specifies server-side encryption and does not use the "aws/kinesis" key.',
    explanation:
      "Customer Managed Keys can incur additional costs that scale with the amount of consumers and producers. Ensure that Customer Managed Keys are required for compliance before using them (https://docs.aws.amazon.com/streams/latest/dev/costs-performance.html).",
    level: NagMessageLevel.WARN,
    rule: rules.kinesis.KinesisDataStreamDefaultKeyWhenSSE,
  },
  {
    info: "The Kinesis Data Stream does not have server-side encryption enabled.",
    explanation:
      "Data is encrypted before it's written to the Kinesis stream storage layer, and decrypted after it’s retrieved from storage. This allows the system to meet strict regulatory requirements and enhance the security of system data.",
    level: NagMessageLevel.WARN,
    rule: rules.kinesis.KinesisDataStreamSSE,
  },
  {
    info: "The KMS Symmetric key does not have automatic key rotation enabled.",
    explanation:
      "KMS key rotation allow a system to set a rotation schedule for a KMS key so when a AWS KMS key is required to encrypt new data, the KMS service can automatically use the latest version of the HSA backing key to perform the encryption.",
    level: NagMessageLevel.WARN,
    rule: rules.kms.KMSBackingKeyRotationEnabled,
  },
  {
    info: "The Lambda function permission grants public access",
    explanation:
      "Public access allows anyone on the internet to perform unauthenticated actions on your function and can potentially lead to degraded availability.\n\nExample threat: A global internet-based actor who has discovered the Lambda function name or ARN can invoke/delete/modify the Lambda function without any authentication, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.lambda.LambdaFunctionPublicAccessProhibited,
  },
  {
    info: "The Lambda Function URL allows for public, unauthenticated access.",
    explanation:
      "AWS Lambda Function URLs allow you to invoke your function via a HTTPS end-point, setting the authentication to NONE allows anyone on the internet to invoke your function.\n\nExample threat: A global internet-based actor who has discovered the Lambda Function URL can invoke the Lambda function without any authentication, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.lambda.LambdaFunctionUrlAuth,
  },
  {
    info: "The non-container Lambda function is not configured to use the latest runtime version.",
    explanation:
      "Use the latest available runtime for the targeted language to avoid technical debt. Runtimes specific to a language or framework version are deprecated when the version reaches end of life. This rule only applies to non-container Lambda functions.",
    level: NagMessageLevel.WARN,
    rule: rules.lambda.LambdaLatestVersion,
  },
  {
    info: "The MediaStore container does not define a CORS policy.",
    explanation:
      "Using a CORS policy helps follow the standard security advice of granting least privilege, or granting only the permissions required to allow needed access to the container.",
    level: NagMessageLevel.WARN,
    rule: rules.mediastore.MediaStoreContainerCORSPolicy,
  },
  {
    info: "The MediaStore container does not define a container policy.",
    explanation:
      "Using a container policy helps follow the standard security advice of granting least privilege, or granting only the permissions required to allow needed access to the container.",
    level: NagMessageLevel.WARN,
    rule: rules.mediastore.MediaStoreContainerHasContainerPolicy,
  },
  {
    info: "The MediaStore container does not require requests to use SSL.",
    explanation:
      "You can use HTTPS (TLS) to help prevent potential attackers from eavesdropping on or manipulating network traffic using person-in-the-middle or similar attacks. You should allow only encrypted connections over HTTPS (TLS) using the aws:SecureTransport condition on MediaStore container policies.",
    level: NagMessageLevel.WARN,
    rule: rules.mediastore.MediaStoreContainerSSLRequestsOnly,
  },
  {
    info: "The MSK cluster uses plaintext communication between brokers.",
    explanation:
      "TLS communication secures data-in-transit by encrypting the connection between brokers.",
    level: NagMessageLevel.WARN,
    rule: rules.msk.MSKBrokerToBrokerTLS,
  },
  {
    info: "The MSK cluster uses plaintext communication between clients and brokers.",
    explanation:
      "TLS only communication secures data-in-transit by encrypting the connection between the clients and brokers.",
    level: NagMessageLevel.WARN,
    rule: rules.msk.MSKClientToBrokerTLS,
  },
  {
    info: "The Neptune DB instance does have Auto Minor Version Upgrade enabled.",
    explanation:
      "The Neptune service regularly releases engine updates. Enabling Auto Minor Version Upgrade will allow the service to automatically apply these upgrades to DB Instances.\n\nExample threat: An actor with a network path to the Neptune cluster or instance can attempt to take advantage of a known vulnerability in a component exposed by Neptune, which may lead to unknown impacts possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.neptune.NeptuneClusterAutomaticMinorVersionUpgrade,
  },
  {
    info: "The Neptune DB cluster does not have encryption at rest enabled.",
    explanation:
      "Encrypting data-at-rest protects data confidentiality and prevents unauthorized users from accessing sensitive information.",
    level: NagMessageLevel.WARN,
    rule: rules.neptune.NeptuneClusterEncryptionAtRest,
  },
  {
    info: "The Neptune DB cluster does not have IAM Database Authentication enabled.",
    explanation:
      "With IAM Database Authentication enabled, the system doesn't have to use a password when connecting to the cluster.",
    level: NagMessageLevel.WARN,
    rule: rules.neptune.NeptuneClusterIAMAuth,
  },
  {
    info: "The OpenSearch Service domain does not only grant access via allowlisted IP addresses.",
    explanation:
      "Using allowlisted IP addresses helps protect the domain against unauthorized access.",
    level: NagMessageLevel.WARN,
    rule: rules.opensearch.OpenSearchAllowlistedIPs,
  },
  {
    info: "The OpenSearch Service domain does not have encryption at rest enabled.",
    explanation:
      "Because sensitive data can exist and to help protect data at rest, ensure encryption is enabled for your Amazon OpenSearch Service (OpenSearch Service) domains.",
    level: NagMessageLevel.WARN,
    rule: rules.opensearch.OpenSearchEncryptedAtRest,
  },
  {
    info: "The OpenSearch Service domain is not provisioned inside a VPC.",
    explanation:
      "Provisioning the domain within a VPC enables better flexibility and control over the clusters access and security as this feature keeps all traffic between the VPC and OpenSearch domains within the AWS network instead of going over the public Internet.\n\nExample threat: A global internet-based actor can discover the OpenSearch Service domain that have public IP addresses, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data with the cluster used within the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.opensearch.OpenSearchInVPCOnly,
  },
  {
    info: "The OpenSearch Service domain does not have node-to-node encryption enabled.",
    explanation:
      "Because sensitive data can exist, enable encryption in transit to help protect that data within your Amazon OpenSearch Service (OpenSearch Service) domains.",
    level: NagMessageLevel.WARN,
    rule: rules.opensearch.OpenSearchNodeToNodeEncryption,
  },
  {
    info: "The OpenSearch Service domain does not allow for unsigned requests or anonymous access.",
    explanation:
      "Restricting public access helps prevent unauthorized access and prevents any unsigned requests to be made to the resources.\n\nExample threat: An actor with a network path to the OpenSearch Service domain can directly access the domain without authentication, which may lead to allowing access to data hosted within the domain possibly impacting the confidentiality, integrity and availability of the data assets hosted on the OpenSearch Service domain for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.opensearch.OpenSearchNoUnsignedOrAnonymousAccess,
  },
  {
    info: "The Quicksight data sources connection is not configured to use SSL.",
    explanation:
      "SSL secures communications to data sources, especially when using public networks. Using SSL with QuickSight requires the use of certificates signed by a publicly-recognized certificate authority.",
    level: NagMessageLevel.WARN,
    rule: rules.quicksight.QuicksightSSLConnections,
  },
  {
    info: "The RDS Aurora MySQL/PostgresSQL cluster does not have IAM Database Authentication enabled.",
    explanation:
      "With IAM Database Authentication enabled, the system doesn't have to use a password when connecting to the MySQL/PostgreSQL database instances, instead it uses an authentication token.",
    level: NagMessageLevel.WARN,
    rule: rules.rds.AuroraMySQLPostgresIAMAuth,
  },
  {
    info: "The RDS DB instance does not have automatic minor version upgrades enabled.",
    explanation:
      "Enable automatic minor version upgrades on your Amazon Relational Database Service (RDS) instances to ensure the latest minor version updates to the Relational Database Management System (RDBMS) are installed, which may include security patches and bug fixes.\n\nExample threat: An actor with a network path to the RDS cluster or instance can attempt to take advantage of a known vulnerability in a component exposed by RDS, which may lead to unknown impacts possibly impacting the confidentiality, integrity and availability of the data assets hosted on the RDS Cluster or instance for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.rds.RDSAutomaticMinorVersionUpgradeEnabled,
  },
  {
    info: "The RDS DB instance allows public access.",
    explanation:
      "Amazon RDS database instances can contain sensitive information, hence appropriate access control and principles of least privilege should be applied.\n\nExample threat: A global internet-based actor who has discovered the RDS DB instance endpoint can perform reconnaissance and intrusion activities (e.g. brute force/dictionary attack to authenticate as a valid user) against the exposed attack surface, which may lead to possibly impacting the confidentiality, integrity and availability of the data assets hosted on the RDS Cluster or instance for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.rds.RDSInstancePublicAccess,
  },
  {
    info: "The RDS instance or Aurora DB cluster uses the default endpoint port.",
    explanation:
      "Port obfuscation (using a non default endpoint port) adds an additional layer of defense against non-targeted attacks (i.e. MySQL/Aurora port 3306, SQL Server port 1433, PostgreSQL port 5432, etc).",
    level: NagMessageLevel.WARN,
    rule: rules.rds.RDSNonDefaultPort,
  },
  {
    info: "The RDS DB Security Group allows for 0.0.0.0/0 inbound access.",
    explanation:
      "RDS DB security groups should not allow access from 0.0.0.0/0 (i.e. anywhere, every machine that has the ability to establish a connection) in order to reduce the risk of unauthorized access.\n\nExample threat: A global internet-based actor can discover RDS DB instances that have public IP addresses and allow ingress to all internet address or move laterally to non-public RDS DB instances, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data assets hosted on the RDS Cluster or instance for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.rds.RDSRestrictedInbound,
  },
  {
    info: "The RDS DB instance or Aurora DB cluster does not have encryption at rest enabled.",
    explanation:
      "Because sensitive data can exist at rest in Amazon RDS DB instances, enable encryption at rest to help protect that data.",
    level: NagMessageLevel.WARN,
    rule: rules.rds.RDSStorageEncrypted,
  },
  {
    info: "The Redshift cluster does not have encryption at rest enabled.",
    explanation: "Encrypting data-at-rest protects data confidentiality.",
    level: NagMessageLevel.WARN,
    rule: rules.redshift.RedshiftClusterEncryptionAtRest,
  },
  {
    info: "The Redshift cluster is not provisioned in a VPC.",
    explanation:
      "Provisioning the cluster within a VPC allows for better flexibility and control over the Redshift clusters security, availability, traffic routing and more.\n\nExample threat: A global internet-based actor can discover a RedShift cluster that have public IP addresses, which may lead to reconnaissance and intrusion activities (e.g. brute force/dictionary attack to authenticate as a valid user) being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data with the cluster used within the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.redshift.RedshiftClusterInVPC,
  },
  {
    info: "The Redshift cluster uses the default endpoint port.",
    explanation:
      "Port obfuscation (using a non default endpoint port) adds an additional layer of defense against non-targeted attacks (i.e. Redshift port 5439).",
    level: NagMessageLevel.WARN,
    rule: rules.redshift.RedshiftClusterNonDefaultPort,
  },
  {
    info: 'The Redshift cluster uses the default "awsuser" username.',
    explanation:
      'Using a custom user name instead of the default master user name (i.e. "awsuser") provides an additional layer of defense against non-targeted attacks.',
    level: NagMessageLevel.WARN,
    rule: rules.redshift.RedshiftClusterNonDefaultUsername,
  },
  {
    info: "The Redshift cluster allows public access.",
    explanation:
      "Amazon Redshift clusters can contain sensitive information, hence appropriate access control and principles of least privilege should be applied.\n\nExample threat: A global internet-based actor who has discovered the Redshift cluster endpoint can perform reconnaissance and intrusion activities (e.g. brute force/dictionary attack to authenticate as a valid user) against the exposed attack surface, which may lead to possibly impacting the confidentiality, integrity and availability of the data assets hosted on the Redshift cluster for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.redshift.RedshiftClusterPublicAccess,
  },
  {
    info: "The Redshift cluster does not have version upgrade enabled.",
    explanation:
      "Version Upgrade must enabled on the cluster in order to automatically receive upgrades during the maintenance window.\n\nExample threat: An actor with a network path to the Redshift cluster can attempt to take advantage of a known vulnerability in a component exposed by Redshift, which may lead to unknown impacts possibly impacting the confidentiality, integrity and availability of the data assets hosted on the Redshift cluster for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.redshift.RedshiftClusterVersionUpgrade,
  },
  {
    info: "The Redshift cluster does not require TLS/SSL encryption.",
    explanation:
      "Ensure that your Amazon Redshift clusters require TLS/SSL encryption to connect to SQL clients. Because sensitive data can exist, enable encryption in transit to help protect that data.",
    level: NagMessageLevel.WARN,
    rule: rules.redshift.RedshiftRequireTlsSSL,
  },
  {
    info: "The S3 bucket does not prohibit public access through bucket level settings.",
    explanation:
      "Keep sensitive data safe from unauthorized remote users by preventing public access at the bucket level.\n\nExample threat: A global internet-based actor who has discovered a S3 bucket configured for public read or write can read or write data to or from the S3 bucket, which may lead to possibly impacting the confidentiality, integrity and availability of the data assets hosted on the S3 bucket for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.s3.S3BucketLevelPublicAccessProhibited,
  },
  {
    info: "The S3 Bucket does not have server access logs enabled.",
    explanation:
      "Amazon Simple Storage Service (Amazon S3) server access logging provides a method to monitor the network for potential cybersecurity events. The events are monitored by capturing detailed records for the requests that are made to an Amazon S3 bucket. Each access log record provides details about a single access request. The details include the requester, bucket name, request time, request action, response status, and an error code, if relevant.",
    level: NagMessageLevel.WARN,
    rule: rules.s3.S3BucketLoggingEnabled,
  },
  {
    info: "The S3 Bucket does not prohibit public read access through its Block Public Access configurations and bucket ACLs.",
    explanation:
      "The management of access should be consistent with the classification of the data.\n\nExample threat: A global internet-based actor who has discovered a S3 bucket configured for public read can read data from the S3 bucket, which may lead to possibly impacting the confidentiality of the data assets hosted on the S3 bucket for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.s3.S3BucketPublicReadProhibited,
  },
  {
    info: "The S3 Bucket does not prohibit public write access through its Block Public Access configurations and bucket ACLs.",
    explanation:
      "The management of access should be consistent with the classification of the data.\n\nExample threat: A global internet-based actor who has discovered a S3 bucket configured for public write can write data to, or overwrite data within the S3 bucket, which may lead to possibly impacting the integrity and availability of the data assets hosted on the S3 bucket for the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.s3.S3BucketPublicWriteProhibited,
  },
  {
    info: "The S3 Bucket or bucket policy does not require requests to use SSL/TLS.",
    explanation:
      "You can use HTTPS (TLS) to help prevent potential attackers from eavesdropping on or manipulating network traffic using person-in-the-middle or similar attacks. You should allow only encrypted connections over HTTPS (TLS) using the aws:SecureTransport condition on Amazon S3 bucket policies.",
    level: NagMessageLevel.WARN,
    rule: rules.s3.S3BucketSSLRequestsOnly,
  },
  {
    info: "The S3 static website bucket either has an open world bucket policy or does not use a CloudFront Origin Access Identity (OAI) in the bucket policy for limited getObject and/or putObject permissions.",
    explanation:
      "An OAI allows you to provide access to content in your S3 static website bucket through CloudFront URLs without enabling public access through an open bucket policy, disabling S3 Block Public Access settings, and/or through object ACLs.\n\nExample threat: A global internet-based actor who has discovered a S3 hosted website can discover prototype web assets that are hosted on the website, which may lead to recon and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.s3.S3WebBucketOAIAccess,
  },
  {
    info: "The SageMaker notebook instance does not have an encrypted storage volume.",
    explanation:
      "Encrypting storage volumes helps protect SageMaker data-at-rest.",
    level: NagMessageLevel.WARN,
    rule: rules.sagemaker.SageMakerNotebookInstanceKMSKeyConfigured,
  },
  {
    info: "The SageMaker notebook instance is not provisioned inside a VPC.",
    explanation:
      "Provisioning the notebook instances inside a VPC enables the notebook to access VPC-only resources such as EFS file systems.",
    level: NagMessageLevel.WARN,
    rule: rules.sagemaker.SageMakerNotebookInVPC,
  },
  {
    info: "The SageMaker notebook does not disable direct internet access.",
    explanation:
      "By preventing direct internet access, you can keep sensitive data from being accessed by unauthorized users.",
    level: NagMessageLevel.WARN,
    rule: rules.sagemaker.SageMakerNotebookNoDirectInternetAccess,
  },
  {
    info: "The secret does not have automatic rotation scheduled.",
    explanation:
      "Rotating secrets on a regular schedule can shorten the period a secret is active, and potentially reduce the business impact if the secret is compromised.",
    level: NagMessageLevel.WARN,
    rule: rules.secretsmanager.SecretsManagerRotationEnabled,
  },
  {
    info: "The SNS Topic does not require publishers to use SSL.",
    explanation:
      "Without HTTPS (TLS), a network-based attacker can eavesdrop on network traffic or manipulate it, using an attack such as man-in-the-middle. Allow only encrypted connections over HTTPS (TLS) using the aws:SecureTransport condition and the 'sns:Publish' action in the topic policy to force publishers to use SSL. If SSE is already enabled then this control is auto enforced.",
    level: NagMessageLevel.WARN,
    rule: rules.sns.SNSTopicSSLPublishOnly,
  },
  {
    info: "The SQS Queue does not have server-side encryption enabled.",
    explanation:
      "Server side encryption adds additional protection of sensitive data delivered as messages to subscribers.",
    level: NagMessageLevel.WARN,
    rule: rules.sqs.SQSQueueSSE,
  },
  {
    info: "The SQS queue does not require requests to use SSL.",
    explanation:
      "Without HTTPS (TLS), a network-based attacker can eavesdrop on network traffic or manipulate it, using an attack such as man-in-the-middle. Allow only encrypted connections over HTTPS (TLS) using the aws:SecureTransport condition in the queue policy to force requests to use SSL.",
    level: NagMessageLevel.WARN,
    rule: rules.sqs.SQSQueueSSLRequestsOnly,
  },
  {
    info: "The Timestream database does not use a Customer Managed KMS Key for at rest encryption.",
    explanation:
      "All Timestream tables in a database are encrypted at rest by default using an AWS Managed Key. These keys are rotated every three years. Data at rest must be encrypted using CMKs if you require more control over the permissions and lifecycle of your keys, including the ability to have them automatically rotated on an periodic basis.",
    level: NagMessageLevel.WARN,
    rule: rules.timestream.TimestreamDatabaseCustomerManagedKey,
  },
  {
    info: "A Network ACL or Network ACL entry has been implemented.",
    explanation:
      "Network ACLs should be used sparingly for the following reasons: they can be complex to manage, they are stateless, every IP address must be explicitly opened in each (inbound/outbound) direction, and they affect a complete subnet. Use security groups when possible as they are stateful and easier to manage.",
    level: NagMessageLevel.WARN,
    rule: rules.vpc.VPCNoNACLs,
  },
  {
    info: "The subnet auto-assigns public IP addresses.",
    explanation:
      "Manage access to the AWS Cloud by ensuring Amazon Virtual Private Cloud (VPC) subnets are not automatically assigned a public IP address. Amazon Elastic Compute Cloud (EC2) instances that are launched into subnets that have this attribute enabled have a public IP address assigned to their primary network interface.\n\nExample threat: A global internet-based actor can discover VPC-attached resources (e.g. EC2 instances) within the subnet in question that have public IP addresses, which may lead to reconnaissance and intrusion activities being performed against the exposed attack surface possibly impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
    level: NagMessageLevel.ERROR,
    rule: rules.vpc.VPCSubnetAutoAssignPublicIpDisabled,
  },
];
