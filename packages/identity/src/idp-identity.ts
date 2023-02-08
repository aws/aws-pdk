/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
export * from "./cdk-internals";

import {
  IdentityPool,
  IdentityPoolProps,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Duration, RemovalPolicy, Annotations } from "aws-cdk-lib";
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
  // UserPoolIdentityProvider,
  IUserPoolIdentityProvider,
  UserPoolClientIdentityProvider,
  UserPoolProps,
  CognitoDomainOptions,
  CustomDomainOptions,
  UserPoolDomain,
  IUserPool,
  UserPoolClientOptions,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import {
  UserPoolIdentityProviderAmazonProps,
  UserPoolIdentityProviderAppleProps,
  UserPoolIdentityProviderFacebookProps,
  UserPoolIdentityProviderGoogleProps,
  UserPoolIdentityProviderOidcProps,
  UserPoolIdentityProviderSamlProps,
} from "./cdk-internals";
import { IdentityProviderName } from "./cdk-internals/identityProviders";

export const defaultPasswordPolicy: PasswordPolicy = {
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

/**
 * Properties which configures the IDP Identity construct.
 */
export interface IdpIdentityProps {
  /**
   * User provided Cognito UserPool.
   *
   * @default - a userpool will be created.
   */
  readonly userPool?: IUserPool;

  /**
   * Props for the UserPool construct
   */
  readonly userPoolProps?: UserPoolProps;

  /**
   * Options while specifying a cognito prefix domain.
   * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain-prefix.html
   */
  readonly cognitoDomain?: CognitoDomainOptions;

  /**
   * Options while specifying custom domain
   * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html
   */
  readonly customDomain?: CustomDomainOptions;

  /**
   * Configuration for the Identity Pool.
   */
  readonly identityPoolOptions?: IdentityPoolProps;

  /**
   * Configuration for the Federated Identity Providers.
   */
  readonly identityProviderProps?: IdentityProviderProps;

  /**
   * Options to create a UserPoolClient
   */
  readonly userPoolClientProps?: UserPoolClientOptions;

  identityProviders?: IdentityProviderProps;
}

/**
 * Properties which configure a user pool client.
 */
export interface AddClientProps extends UserPoolClientOptions {
  /**
   * List of allowed redirect URLs for the identity providers.
   * @default - ['https://example.com'] if either authorizationCodeGrant or implicitCodeGrant flows are enabled, no callback URLs otherwise.
   */
  callbackUrls: Array<string>;

  /**
   * List of allowed logout URLs for the identity providers.
   * @default - no logout URLs
   */
  logoutUrls: Array<string>;

  /**
   * Options while specifying a cognito prefix domain.
   * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain-prefix.html
   */
  readonly cognitoDomain?: CognitoDomainOptions;

  /**
   * Options while specifying custom domain
   * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html
   */
  readonly customDomain?: CustomDomainOptions;

  useIdentityProvider?: Array<UserPoolClientIdentityProvider>;
}

/**
 * Properties which configure a domain for the user pool.
 */
interface CreateUserPoolProps extends UserPoolProps {
  readonly cognitoDomain?: CognitoDomainOptions;
  readonly customDomain?: CustomDomainOptions;
}

/**
 * Creates a user pool will one or more federated identity providers
 */
export class IdpIdentity extends Construct {
  public userPool: IUserPool;
  public userPoolClient?: UserPoolClient;
  protected hasIdentityPool: boolean = false;
  protected identityProviders: Array<IUserPoolIdentityProvider> = [];

  constructor(scope: Construct, id: string, readonly props?: IdpIdentityProps) {
    super(scope, id);
    Annotations.of(this).addInfo(`${JSON.stringify(props)}`);

    if (props?.userPool) {
      this.userPool = props.userPool!;
    } else {
      this.userPool = this.createUserPool(id, props);
      this.addDomain(id, this.userPool, {
        cognitoDomain: props?.cognitoDomain,
        customDomain: props?.customDomain,
      });
      this.attachIdentityProviders(
        id,
        props?.identityProviders!,
        this.userPool
      );
    }
  }

  protected addDomain = (
    id: string,
    userPool: IUserPool,
    props: CreateUserPoolProps
  ) => {
    if (props?.cognitoDomain) {
      Annotations.of(this).addInfo("cognitoDomain");
      new UserPoolDomain(this, `${id}-cognitoDomain`, {
        cognitoDomain: props?.cognitoDomain,
        userPool: userPool,
      });
    } else if (props?.customDomain) {
      Annotations.of(this).addInfo("customDomain");
      new UserPoolDomain(this, `${id}-customDomain`, {
        customDomain: props?.customDomain,
        userPool: userPool,
      });
    }
  };

  protected createUserPool = (id: string, props?: CreateUserPoolProps) => {
    const ret = new UserPool(this, "UserPool", {
      userPoolName: id,
      removalPolicy: RemovalPolicy.RETAIN,
      deletionProtection: true,
      passwordPolicy: defaultPasswordPolicy,
      mfa: Mfa.REQUIRED,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        email: true,
      },
      ...props,
    });

    (ret.node.defaultChild as CfnUserPool).userPoolAddOns = {
      advancedSecurityMode: "ENFORCED",
    };

    return ret;
  };

  protected attachIdentityProviders = (
    id: string,
    identityProviders: IdentityProviderProps,
    userPool: IUserPool
  ): void => {
    for (const [identityProviderName, props] of Object.entries(
      identityProviders
    )) {
      let provider:
        | UserPoolIdentityProviderAmazon
        | UserPoolIdentityProviderApple
        | UserPoolIdentityProviderFacebook
        | UserPoolIdentityProviderGoogle
        | UserPoolIdentityProviderOidc
        | UserPoolIdentityProviderSaml;

      switch (identityProviderName) {
        case IdentityProviderName.AMAZON:
          provider = new UserPoolIdentityProviderAmazon(this, id + "-Amazon", {
            ...props,
            userPool,
          });
          break;
        case IdentityProviderName.APPLE:
          provider = new UserPoolIdentityProviderApple(this, id + "-Apple", {
            ...props,
            userPool,
          });
          break;
        case IdentityProviderName.FACEBOOK:
          provider = new UserPoolIdentityProviderFacebook(
            this,
            id + "-Facebook",
            { ...props, userPool }
          );
          break;
        case IdentityProviderName.GOOGLE:
          provider = new UserPoolIdentityProviderGoogle(this, id + "-Google", {
            ...props,
            userPool,
          });
          break;
        case IdentityProviderName.OIDC:
          provider = new UserPoolIdentityProviderOidc(this, id + "-Oidc", {
            ...props,
            userPool,
          });
          break;
        case IdentityProviderName.SAML:
          provider = new UserPoolIdentityProviderSaml(this, id + "-Saml", {
            ...props,
            userPool,
          });
          break;
        default:
          Annotations.of(this).addError("Unsupported IDP type");
          throw new Error("Unsupported IDP type");
      }
      this.identityProviders.push(provider);
    }
  };

  public addClientApplication = (
    id: string,
    props?: AddClientProps
  ): UserPoolClient => {
    const client = new UserPoolClient(this, id, {
      userPoolClientName: id,
      userPool: this.userPool,
      oAuth: {
        callbackUrls: props?.callbackUrls ? props.callbackUrls : [],
        logoutUrls: props?.logoutUrls ? props.logoutUrls : [],
      },
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: true,
      supportedIdentityProviders: props?.useIdentityProvider,
      ...props,
    });

    client.node.addDependency(this.userPool);

    !this.hasIdentityPool &&
      this.createIdentityPool(id, client).node.addDependency(client);

    return client;
  };

  public createIdentityPool = (
    id: string,
    client: UserPoolClient,
    props?: any
  ) => {
    const identityPool = new IdentityPool(this, id + "IdentityPool", {
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
                  userPoolClient: client,
                }),
              ]
            : []),
        ],
      },
    });

    this.hasIdentityPool = true;
    return identityPool;
  };
}
