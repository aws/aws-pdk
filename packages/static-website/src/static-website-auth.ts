import {
  IdentityPool,
  IdentityPoolProps,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import {
  UserPool,
  UserPoolClient,
  UserPoolClientOptions,
  UserPoolProps,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

const DEFAULT_COGNITO_USER_POOL_CLIENT_OPTIONS: UserPoolClientOptions = {
  authFlows: {
    userPassword: true,
    userSrp: true,
  },
};

/**
 * Default Cognito User Pool options.
 */
export interface CognitoUserPoolOptions {
  /**
   * Props for UserPool.
   */
  readonly userPoolOptions?: UserPoolProps;

  /**
   * Props for UserPoolClient.
   */
  readonly userPoolClientOptions?: UserPoolClientOptions;
}

/**
 * Properties which configures the Identity Pool and optional Cognito User Pool.
 */
export interface StaticWebsiteAuthProps {
  /**
   * Determines whether to create a default Cognito User Pool.
   *
   * @default - true
   */
  readonly createCognitoUserPool?: boolean;

  /**
   * Configuration for the default User Pool.
   *
   * Only used when createCognitoUserPool is not false.
   */
  readonly cognitoUserPoolOptions?: CognitoUserPoolOptions;

  /**
   * Configuration for the Identity Pool.
   */
  readonly identityPoolOptions?: IdentityPoolProps;
}

/**
 * Creates an Identity Pool with sane defaults configured.
 */
export class StaticWebsiteAuth extends Construct {
  public readonly userPool?: UserPool;
  public readonly userPoolClient?: UserPoolClient;
  public readonly identityPool: IdentityPool;

  constructor(scope: Construct, id: string, props?: StaticWebsiteAuthProps) {
    super(scope, id);

    // Unless explicitly stated, created a default Cognito User Pool and Web Client.
    if (props?.createCognitoUserPool !== false) {
      this.userPool = new UserPool(
        this,
        "UserPool",
        props?.cognitoUserPoolOptions?.userPoolOptions
      );
      this.userPoolClient = this.userPool.addClient(
        "WebClient",
        props?.cognitoUserPoolOptions?.userPoolClientOptions ||
          DEFAULT_COGNITO_USER_POOL_CLIENT_OPTIONS
      );
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
