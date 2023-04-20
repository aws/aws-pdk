/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { Duration, Stack } from "aws-cdk-lib";
import {
  AccountRecovery,
  AdvancedSecurityMode,
  Mfa,
  UserPool,
  UserPoolProps,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

/**
 * Boolean context to indicate whether legacy MFA props should be used.
 */
export const USE_LEGACY_MFA_PROPS_CONTEXT_KEY =
  "@aws-prototyping-sdk/identity:useLegacyMFAProps";

/**
 * Legacy Userpool Props which configures MFA for SMS only.
 */
const LEGACY_DEFAULT_PROPS: UserPoolProps = {
  deletionProtection: true,
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: true,
    tempPasswordValidity: Duration.days(3),
  },
  advancedSecurityMode: AdvancedSecurityMode.ENFORCED,
  mfa: Mfa.REQUIRED,
  accountRecovery: AccountRecovery.EMAIL_ONLY,
  autoVerify: {
    email: true,
  },
};

/**
 * Userpool default props which configure MFA across SMS/TOTP.
 */
const DEFAULT_PROPS: UserPoolProps = {
  deletionProtection: true,
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: true,
    tempPasswordValidity: Duration.days(3),
  },
  mfa: Mfa.REQUIRED,
  mfaSecondFactor: { sms: true, otp: true },
  signInCaseSensitive: false,
  advancedSecurityMode: AdvancedSecurityMode.ENFORCED,
  signInAliases: { username: true },
  accountRecovery: AccountRecovery.EMAIL_ONLY,
  selfSignUpEnabled: false,
  standardAttributes: {
    phoneNumber: { required: false },
    email: { required: true },
    givenName: { required: true },
    familyName: { required: true },
  },
  autoVerify: {
    email: true,
    phone: true,
  },
  keepOriginal: {
    email: true,
    phone: true,
  },
};

/**
 * UserPoolWithMfa props.
 */
export interface UserPoolWithMfaProps extends UserPoolProps {}

/**
 * Configures a UserPool with MFA across SMS/TOTP using sane defaults.
 */
export class UserPoolWithMfa extends UserPool {
  constructor(scope: Construct, id: string, props?: UserPoolWithMfaProps) {
    super(scope, id, {
      ...(shouldUseLegacyProps(scope) ? LEGACY_DEFAULT_PROPS : DEFAULT_PROPS),
      ...props,
    });

    const stack = Stack.of(this);

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        PDKNag.addResourceSuppressionsByPathNoThrow(
          stack,
          `${PDKNag.getStackPrefix(stack)}${id}/UserPool/smsRole/Resource`,
          [
            {
              id: RuleId,
              reason:
                "MFA requires sending a text to a users phone number which cannot be known at deployment time.",
              appliesTo: ["Resource::*"],
            },
          ]
        );
      }
    );
  }
}

/**
 * Determines if legacy props should be used by looking at the control flag in cdk context.
 *
 * @param scope construct scope.
 */
const shouldUseLegacyProps = (scope: Construct) =>
  scope.node.tryGetContext(USE_LEGACY_MFA_PROPS_CONTEXT_KEY);
