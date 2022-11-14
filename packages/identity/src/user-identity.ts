/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  IdentityPool,
  IdentityPoolProps,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { Stack } from "aws-cdk-lib";
import {
  AccountRecovery,
  CfnUserPool,
  Mfa,
  UserPool,
  UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

/**
 * Properties which configures the Identity Pool.
 */
export interface UserIdentityProps {
  /**
   * User provided Cognito UserPool.
   *
   * @default - a userpool will be created.
   */
  readonly userPool?: UserPool;

  /**
   * Configuration for the Identity Pool.
   */
  readonly identityPoolOptions?: IdentityPoolProps;
}

/**
 * Creates an Identity Pool with sane defaults configured.
 */
export class UserIdentity extends Construct {
  public readonly identityPool: IdentityPool;
  public readonly userPool: UserPool;
  public readonly userPoolClient?: UserPoolClient;

  constructor(scope: Construct, id: string, props?: UserIdentityProps) {
    super(scope, id);

    // Unless explicitly stated, created a default Cognito User Pool and Web Client.
    if (!props?.userPool) {
      this.userPool = new UserPool(this, "UserPool", {
        passwordPolicy: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
        mfa: Mfa.REQUIRED,
        accountRecovery: AccountRecovery.EMAIL_ONLY,
        autoVerify: {
          email: true,
        },
      });

      (this.userPool.node.defaultChild as CfnUserPool).userPoolAddOns = {
        advancedSecurityMode: "ENFORCED",
      };

      const stack = Stack.of(this);
      PDKNag.addResourceSuppressionsByPathNoThrow(
        stack,
        `${PDKNag.getStackPrefix(stack)}${id}/UserPool/smsRole/Resource`,
        [
          {
            id: "AwsSolutions-IAM5",
            reason:
              "MFA requires sending a text to a users phone number which cannot be known at deployment time.",
            appliesTo: ["Resource::*"],
          },
        ]
      );

      this.userPoolClient = this.userPool.addClient("WebClient", {
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
      });
    } else {
      this.userPool = props.userPool;
    }

    this.identityPool = new IdentityPool(this, "IdentityPool", {
      ...props?.identityPoolOptions,
      authenticationProviders: {
        ...props?.identityPoolOptions?.authenticationProviders,
        userPools: [
          ...(props?.identityPoolOptions?.authenticationProviders?.userPools ||
            []),
          ...(!props?.userPool
            ? [
                new UserPoolAuthenticationProvider({
                  userPool: this.userPool,
                  userPoolClient: this.userPoolClient!,
                }),
              ]
            : []),
        ],
      },
    });
  }
}
