import {
  IdentityPool,
  IdentityPoolProps,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
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
  public readonly userPool?: UserPool;
  public readonly userPoolClient?: UserPoolClient;
  public readonly identityPool: IdentityPool;

  constructor(scope: Construct, id: string, props?: UserIdentityProps) {
    super(scope, id);

    // Unless explicitly stated, created a default Cognito User Pool and Web Client.
    if (!props?.userPool) {
      this.userPool = new UserPool(this, "UserPool");
      this.userPoolClient = this.userPool.addClient("WebClient", {
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
      });
    }

    this.identityPool = new IdentityPool(this, "IdentityPool", {
      ...props?.identityPoolOptions,
      authenticationProviders: {
        ...props?.identityPoolOptions?.authenticationProviders,
        userPools: [
          ...(props?.identityPoolOptions?.authenticationProviders?.userPools ||
            []),
          ...(this.userPool
            ? [new UserPoolAuthenticationProvider({ userPool: this.userPool })]
            : []),
        ],
      },
    });
  }
}
