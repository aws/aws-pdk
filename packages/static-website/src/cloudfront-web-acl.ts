import { Names, Stack } from "aws-cdk-lib";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
  PhysicalResourceIdReference,
} from "aws-cdk-lib/custom-resources";
import { WAFV2 } from "aws-sdk";
import { Construct } from "constructs";

const ACL_REGION = "us-east-1";
const SCOPE = "CLOUDFRONT";

/**
 * Represents a WAF V2 managed rule.
 */
export interface ManagedRule {
  /**
   * The name of the managed rule group vendor. You use this, along with the rule group name, to identify the rule group.
   */
  readonly vendor: string;

  /**
   * The name of the managed rule group. You use this, along with the vendor name, to identify the rule group.
   */
  readonly name: string;
}

/**
 * Properties to configure the web acl.
 */
export interface CloudFrontWebAclProps {
  /**
   * List of managed rules to apply to the web acl.
   */
  readonly managedRules: ManagedRule[];
}

/**
 * This construct creates a WAFv2 Web ACL for cloudfront in the us-east-1 region (required for cloudfront) no matter the
 * region of the parent cdk stack.
 */
export class CloudfrontWebAcl extends Construct {
  public readonly webAclId: string;
  public readonly webAclArn: string;
  public readonly name: string;
  public readonly region: string = ACL_REGION;

  constructor(scope: Construct, id: string, props: CloudFrontWebAclProps) {
    super(scope, id);

    this.name = `${id.substring(0, 40)}_${Names.uniqueId(this)}`;

    // The parameters for creating the Web ACL
    const createWebACLRequest: WAFV2.Types.CreateWebACLRequest = {
      Name: this.name,
      DefaultAction: { Allow: {} },
      Scope: SCOPE,
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        MetricName: id,
        SampledRequestsEnabled: true,
      },
      Rules: props.managedRules
        .map((r) => ({ VendorName: r.vendor, Name: r.name }))
        .map((rule, Priority) => ({
          Name: `${rule.VendorName}-${rule.Name}`,
          Priority,
          Statement: { ManagedRuleGroupStatement: rule },
          OverrideAction: { None: {} },
          VisibilityConfig: {
            MetricName: `${rule.VendorName}-${rule.Name}`,
            CloudWatchMetricsEnabled: true,
            SampledRequestsEnabled: true,
          },
        })),
    };

    // Create the Web ACL
    const createCustomResource = new AwsCustomResource(this, `Create`, {
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      onCreate: {
        service: "WAFV2",
        action: "createWebACL",
        parameters: createWebACLRequest,
        region: this.region,
        physicalResourceId: PhysicalResourceId.fromResponse("Summary.Id"),
      },
    });
    this.webAclId = createCustomResource.getResponseField("Summary.Id");

    const getWebACLRequest: WAFV2.Types.GetWebACLRequest = {
      Name: this.name,
      Scope: SCOPE,
      Id: this.webAclId,
    };

    // A second custom resource is used for managing the deletion of this construct, since both an Id and LockToken
    // are required for Web ACL Deletion
    new AwsCustomResource(this, `Delete`, {
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      onCreate: {
        service: "WAFV2",
        action: "getWebACL",
        parameters: getWebACLRequest,
        region: this.region,
        physicalResourceId: PhysicalResourceId.fromResponse("LockToken"),
      },
      onDelete: {
        service: "WAFV2",
        action: "deleteWebACL",
        parameters: {
          Name: this.name,
          Scope: SCOPE,
          Id: this.webAclId,
          LockToken: new PhysicalResourceIdReference(),
        },
        region: this.region,
      },
    });
    this.webAclArn = `arn:aws:wafv2:${this.region}:${
      Stack.of(this).account
    }:global/webacl/${this.name}/${this.webAclId}`;
  }
}
