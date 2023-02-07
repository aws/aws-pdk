/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  IdentityPool,
  IdentityPoolProps,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Duration } from "aws-cdk-lib";
import {
  UserPoolIdentityProviderAmazon,
  UserPoolIdentityProviderApple,
  UserPoolIdentityProviderFacebook,
  UserPoolIdentityProviderGoogle,
  UserPoolIdentityProviderOidc,
  UserPoolIdentityProviderSaml,
  PasswordPolicy,
  UserPool,
  UserPoolClient,
  AccountRecovery,
  CfnUserPool,
  Mfa,
  UserPoolIdentityProvider,
  UserPoolClientIdentityProvider,
} from "aws-cdk-lib/aws-cognito";
// import {
//   AwsCustomResource,
//   PhysicalResourceId,
//   AwsCustomResourcePolicy,
// } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import {
  UserPoolIdentityProviderAmazonProps,
  UserPoolIdentityProviderAppleProps,
  UserPoolIdentityProviderFacebookProps,
  UserPoolIdentityProviderGoogleProps,
  UserPoolIdentityProviderOidcProps,
  UserPoolIdentityProviderSamlProps,
} from "./cdk-internals";
import { IdentityProviderName } from "./identityProviders";
// import { UserIdentity, UserIdentityProps } from "./user-identity";

export * from "./cdk-internals";

export const passwordPolicy: PasswordPolicy = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireDigits: true,
  requireSymbols: true,
  tempPasswordValidity: Duration.days(3),
};

export interface IdentityProviderProps {
  readonly [IdentityProviderName.AMAZON]?: UserPoolIdentityProviderAmazonProps;
  readonly [IdentityProviderName.APPLE]?: UserPoolIdentityProviderAppleProps;
  readonly [IdentityProviderName.FACEBOOK]?: UserPoolIdentityProviderFacebookProps;
  readonly [IdentityProviderName.GOOGLE]?: UserPoolIdentityProviderGoogleProps;
  readonly [IdentityProviderName.OIDC]?: UserPoolIdentityProviderOidcProps;
  readonly [IdentityProviderName.SAML]?: UserPoolIdentityProviderSamlProps;
}

export interface IdpIdentityProps {
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

  readonly identityProviderProps?: IdentityProviderProps;
}

export class IdpIdentity extends Construct {
  public readonly identityPool: IdentityPool;
  public readonly userPool: UserPool;
  public readonly userPoolClient?: UserPoolClient;
  public readonly userPoolIdentityProviders: Array<UserPoolIdentityProvider>;
  public readonly supportedIdentityProviders: Array<UserPoolClientIdentityProvider>;

  constructor(scope: Construct, id: string, readonly props: IdpIdentityProps) {
    super(scope, id);

    this.userPoolIdentityProviders = [];
    this.supportedIdentityProviders = [UserPoolClientIdentityProvider.COGNITO];

    if (!props?.userPool) {
      this.userPool = this.createUserPool();
    } else {
      this.userPool = props.userPool;
    }
    this.identityPool = this.createIdentityPool(props);

    if (props?.identityProviderProps) {
      for (const [
        identityProviderName,
        identityProviderProps,
      ] of Object.entries(props.identityProviderProps)) {
        if (identityProviderProps == null) continue;

        let provider: any;

        switch (identityProviderName) {
          case IdentityProviderName.AMAZON:
            provider = new UserPoolIdentityProviderAmazon(this, "Amazon", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            this.supportedIdentityProviders.push(
              UserPoolClientIdentityProvider.AMAZON
            );
            break;
          case IdentityProviderName.APPLE:
            provider = new UserPoolIdentityProviderApple(this, "Apple", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            this.supportedIdentityProviders.push(
              UserPoolClientIdentityProvider.APPLE
            );
            break;
          case IdentityProviderName.FACEBOOK:
            provider = new UserPoolIdentityProviderFacebook(this, "Facebook", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            this.supportedIdentityProviders.push(
              UserPoolClientIdentityProvider.FACEBOOK
            );
            break;
          case IdentityProviderName.GOOGLE:
            provider = new UserPoolIdentityProviderGoogle(this, "Google", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            this.supportedIdentityProviders.push(
              UserPoolClientIdentityProvider.GOOGLE
            );
            break;
          case IdentityProviderName.OIDC:
            provider = new UserPoolIdentityProviderOidc(this, "Oidc", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            this.supportedIdentityProviders.push(identityProviderProps.name);
            break;
          case IdentityProviderName.SAML:
            provider = new UserPoolIdentityProviderSaml(this, "Saml", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            this.supportedIdentityProviders.push(identityProviderProps.name);
            break;
          default:
            throw new Error("Unsupported IDP type");
        }

        this.userPoolIdentityProviders.push(provider);
        this.userPoolClient?.node.addDependency(provider);
      }
    }
  }

  protected createUserPool = () => {
    const ret = new UserPool(this, "UserPool", {
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(3),
      },
      mfa: Mfa.REQUIRED,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        email: true,
      },
    });

    (ret.node.defaultChild as CfnUserPool).userPoolAddOns = {
      advancedSecurityMode: "ENFORCED",
    };

    return ret;
  };

  protected createUserPoolClient = () => {
    this.userPool.addClient("WebClient", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: this.supportedIdentityProviders,
    });
  };

  protected createIdentityPool = (props: any) => {
    return new IdentityPool(this, "IdentityPool", {
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
  };
}
