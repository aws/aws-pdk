/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { DefaultAuthorizerIds } from "../prepare-spec-event-handler/constants";

/**
 * Properties for an authorizer
 */
export interface AuthorizerProps {
  /**
   * The unique identifier for the authorizer
   */
  readonly authorizerId: string;
  /**
   * The type of the authorizer
   */
  readonly authorizationType: AuthorizationType;
  /**
   * Scopes for the authorizer, if any
   */
  readonly authorizationScopes?: string[];
}

/**
 * An authorizer for authorizing API requests
 */
export abstract class Authorizer {
  /**
   * The unique identifier for the authorizer
   */
  public readonly authorizerId: string;
  /**
   * The type of the authorizer
   */
  public readonly authorizationType: AuthorizationType;
  /**
   * Scopes for the authorizer, if any
   */
  public readonly authorizationScopes?: string[];

  constructor(props: AuthorizerProps) {
    this.authorizerId = props.authorizerId;
    this.authorizationType = props.authorizationType;
    this.authorizationScopes = props.authorizationScopes;
  }
}

/**
 * Properties used to configure a cognito authorizer
 */
export interface CognitoAuthorizerProps {
  /**
   * Unique identifier for this authorizer
   */
  readonly authorizerId: string;
  /**
   * The Cognito user pools associated with this authorizer
   */
  readonly userPools: IUserPool[];
  /**
   * A list of authorization scopes configured on the method. When used as the default authorizer, these scopes will be
   * applied to all methods without an authorizer at the integration level.
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-method.html#cfn-apigateway-method-authorizationscopes
   * @default []
   */
  readonly authorizationScopes?: string[];
}

/**
 * An authorizer that uses Cognito identity or access tokens.
 */
export class CognitoAuthorizer extends Authorizer {
  /**
   * The Cognito user pools associated with this authorizer
   */
  public readonly userPools: IUserPool[];

  constructor(props: CognitoAuthorizerProps) {
    super({
      authorizerId: props.authorizerId,
      authorizationType: AuthorizationType.COGNITO,
      authorizationScopes: props.authorizationScopes,
    });
    this.userPools = props.userPools;
  }

  /**
   * Returns this authorizer with scopes applied, intended for usage in individual operations where scopes may differ
   * on a per-operation basis
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-method.html#cfn-apigateway-method-authorizationscopes
   * @param authorizationScopes the scopes to apply
   */
  public withScopes(...authorizationScopes: string[]) {
    return new CognitoAuthorizer({
      authorizerId: this.authorizerId,
      userPools: this.userPools,
      authorizationScopes,
    });
  }
}

/**
 * The type of custom authorizer
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-authorizer.html#cfn-apigateway-authorizer-type
 */
export enum CustomAuthorizerType {
  /**
   * A custom authorizer that uses a Lambda function.
   */
  TOKEN = "token",
  /**
   * An authorizer that uses a Lambda function using incoming request parameters.
   */
  REQUEST = "request",
}

/**
 * Properties used to configure a custom authorizer
 */
export interface CustomAuthorizerProps {
  /**
   * Unique identifier for this authorizer
   */
  readonly authorizerId: string;
  /**
   * The lambda function used to authorize requests
   */
  readonly function: IFunction;
  /**
   * The type of custom authorizer
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-authorizer.html#cfn-apigateway-authorizer-type
   * @default CustomAuthorizerType.TOKEN
   */
  readonly type?: CustomAuthorizerType;
  /**
   * The source of the identity in an incoming request
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-authorizer.html#cfn-apigateway-authorizer-identitysource
   * @default "method.request.header.Authorization"
   */
  readonly identitySource?: string;
  /**
   * The number of seconds during which the authorizer result is cached
   * @default 300
   */
  readonly authorizerResultTtlInSeconds?: number;
}

// The default time to cache the custom authorizer result
const DEFAULT_CUSTOM_AUTHORIZER_RESULT_TTL_SECONDS = 300;

/**
 * An authorizer that uses a lambda function to authorize requests
 */
export class CustomAuthorizer extends Authorizer {
  /**
   * The lambda function used to authorize requests
   */
  public readonly function: IFunction;
  /**
   * The type of custom authorizer
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-authorizer.html#cfn-apigateway-authorizer-type
   */
  public readonly type: CustomAuthorizerType;
  /**
   * The source of the identity in an incoming request
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-authorizer.html#cfn-apigateway-authorizer-identitysource
   */
  public readonly identitySource: string;
  /**
   * The number of seconds during which the authorizer result is cached
   */
  public readonly authorizerResultTtlInSeconds: number;

  constructor(props: CustomAuthorizerProps) {
    super({
      authorizerId: props.authorizerId,
      authorizationType: AuthorizationType.CUSTOM,
    });
    this.function = props.function;
    this.type = props.type ?? CustomAuthorizerType.TOKEN;
    this.identitySource =
      props.identitySource ?? "method.request.header.Authorization";
    this.authorizerResultTtlInSeconds =
      props.authorizerResultTtlInSeconds ??
      DEFAULT_CUSTOM_AUTHORIZER_RESULT_TTL_SECONDS;
  }
}

/**
 * No authorizer
 */
export class NoneAuthorizer extends Authorizer {
  constructor() {
    super({
      authorizerId: DefaultAuthorizerIds.NONE,
      authorizationType: AuthorizationType.NONE,
    });
  }
}

/**
 * An IAM authorizer
 */
export class IamAuthorizer extends Authorizer {
  constructor() {
    super({
      authorizerId: DefaultAuthorizerIds.IAM,
      authorizationType: AuthorizationType.IAM,
    });
  }
}

/**
 * Class used to construct authorizers for use in the OpenApiGatewayLambdaApi construct
 */
export class Authorizers {
  /**
   * An IAM authorizer which uses AWS signature version 4 to authorize requests
   */
  public static iam(): IamAuthorizer {
    return new IamAuthorizer();
  }

  /**
   * No authorizer
   */
  public static none(): NoneAuthorizer {
    return new NoneAuthorizer();
  }

  /**
   * A Cognito User Pools authorizer
   */
  public static cognito(props: CognitoAuthorizerProps): CognitoAuthorizer {
    return new CognitoAuthorizer(props);
  }

  /**
   * A custom authorizer
   */
  public static custom(props: CustomAuthorizerProps): CustomAuthorizer {
    return new CustomAuthorizer(props);
  }
}
