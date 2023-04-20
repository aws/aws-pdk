/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  IdentityPool,
  IdentityPoolProps,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { UserPoolWithMfa } from "./userpool-with-mfa";

const WEB_CLIENT_ID = "WebClient";

/**
 * Properties which configures the Identity Pool.
 */
export interface UserIdentityProps {
  /**
   * User provided Cognito UserPool.
   *
   * @default - a userpool with mfa will be created.
   */
  readonly userPool?: UserPool;

  /**
   * Configuration for the Identity Pool.
   */
  readonly identityPoolOptions?: IdentityPoolProps;
}

/**
 * Creates a UserPool and Identity Pool with sane defaults configured intended for usage from a web client.
 */
export class UserIdentity extends Construct {
  public readonly identityPool: IdentityPool;
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props?: UserIdentityProps) {
    super(scope, id);

    // Unless explicitly stated, created a default Cognito User Pool and Web Client.
    this.userPool = !props?.userPool
      ? new UserPoolWithMfa(this, "UserPool")
      : props.userPool;

    this.identityPool = new IdentityPool(
      this,
      "IdentityPool",
      props?.identityPoolOptions
    );

    const existingClient = this.userPool.node.children.find(
      (e) => e.node.id === WEB_CLIENT_ID && e instanceof UserPoolClient
    ) as UserPoolClient | undefined;

    this.userPoolClient =
      existingClient ??
      this.userPool.addClient(WEB_CLIENT_ID, {
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
      });

    this.identityPool.addUserPoolAuthentication(
      new UserPoolAuthenticationProvider({
        userPool: this.userPool,
        userPoolClient: this.userPoolClient!,
      })
    );
  }
}
