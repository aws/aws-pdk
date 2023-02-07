/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  AttributeMapping,
  OidcAttributeRequestMethod,
  OidcEndpoints,
  UserPoolIdentityProviderSamlMetadata,
} from "aws-cdk-lib/aws-cognito";

export interface UserPoolIdentityProviderAmazonProps {
  /**
   * The client id recognized by 'Login with Amazon' APIs.
   * @see https://developer.amazon.com/docs/login-with-amazon/security-profile.html#client-identifier
   */
  readonly clientId: string;
  /**
   * The client secret to be accompanied with clientId for 'Login with Amazon' APIs to authenticate the client.
   * @see https://developer.amazon.com/docs/login-with-amazon/security-profile.html#client-identifier
   */
  readonly clientSecret: string;
  /**
   * The types of user profile data to obtain for the Amazon profile.
   * @see https://developer.amazon.com/docs/login-with-amazon/customer-profile.html
   * @default [ profile ]
   */
  readonly scopes?: string[];
  /**
   * Mapping attributes from the identity provider to standard and custom attributes of the user pool.
   * @default - no attribute mapping
   */
  readonly attributeMapping?: AttributeMapping;
}

export interface UserPoolIdentityProviderAppleProps {
  /**
   * The client id recognized by Apple APIs.
   * @see https://developer.apple.com/documentation/sign_in_with_apple/clientconfigi/3230948-clientid
   */
  readonly clientId: string;
  /**
   * The teamId for Apple APIs to authenticate the client.
   */
  readonly teamId: string;
  /**
   * The keyId (of the same key, which content has to be later supplied as `privateKey`) for Apple APIs to authenticate the client.
   */
  readonly keyId: string;
  /**
   * The privateKey content for Apple APIs to authenticate the client.
   */
  readonly privateKey: string;
  /**
   * The list of apple permissions to obtain for getting access to the apple profile
   * @see https://developer.apple.com/documentation/sign_in_with_apple/clientconfigi/3230955-scope
   * @default [ name ]
   */
  readonly scopes?: string[];
  /**
   * Mapping attributes from the identity provider to standard and custom attributes of the user pool.
   * @default - no attribute mapping
   */
  readonly attributeMapping?: AttributeMapping;
}

export interface UserPoolIdentityProviderFacebookProps {
  /**
   * The client id recognized by Facebook APIs.
   */
  readonly clientId: string;
  /**
   * The client secret to be accompanied with clientUd for Facebook to authenticate the client.
   * @see https://developers.facebook.com/docs/facebook-login/security#appsecret
   */
  readonly clientSecret: string;
  /**
   * The list of facebook permissions to obtain for getting access to the Facebook profile.
   * @see https://developers.facebook.com/docs/facebook-login/permissions
   * @default [ public_profile ]
   */
  readonly scopes?: string[];
  /**
   * The Facebook API version to use
   * @default - to the oldest version supported by Facebook
   */
  readonly apiVersion?: string;
  /**
   * Mapping attributes from the identity provider to standard and custom attributes of the user pool.
   * @default - no attribute mapping
   */
  readonly attributeMapping?: AttributeMapping;
}

export interface UserPoolIdentityProviderGoogleProps {
  /**
   * The client id recognized by Google APIs.
   * @see https://developers.google.com/identity/sign-in/web/sign-in#specify_your_apps_client_id
   */
  readonly clientId: string;
  /**
   * The client secret to be accompanied with clientId for Google APIs to authenticate the client.
   * @see https://developers.google.com/identity/sign-in/web/sign-in
   */
  readonly clientSecret: string;
  /**
   * The list of google permissions to obtain for getting access to the google profile
   * @see https://developers.google.com/identity/sign-in/web/sign-in
   * @default [ profile ]
   */
  readonly scopes?: string[];
  /**
   * Mapping attributes from the identity provider to standard and custom attributes of the user pool.
   * @default - no attribute mapping
   */
  readonly attributeMapping?: AttributeMapping;
}

export interface UserPoolIdentityProviderOidcProps {
  /**
   * The client id
   */
  readonly clientId: string;
  /**
   * The client secret
   */
  readonly clientSecret: string;
  /**
   * Issuer URL
   */
  readonly issuerUrl: string;
  /**
   * The name of the provider
   *
   * @default - the unique ID of the construct
   */
  readonly name?: string;
  /**
   * The OAuth 2.0 scopes that you will request from OpenID Connect. Scopes are
   * groups of OpenID Connect user attributes to exchange with your app.
   *
   * @default ['openid']
   */
  readonly scopes?: string[];
  /**
   * Identifiers
   *
   * Identifiers can be used to redirect users to the correct IdP in multitenant apps.
   *
   * @default - no identifiers used
   */
  readonly identifiers?: string[];
  /**
   * The method to use to request attributes
   *
   * @default OidcAttributeRequestMethod.GET
   */
  readonly attributeRequestMethod?: OidcAttributeRequestMethod;
  /**
   * OpenID connect endpoints
   *
   * @default - auto discovered with issuer URL
   */
  readonly endpoints?: OidcEndpoints;
  /**
   * Mapping attributes from the identity provider to standard and custom attributes of the user pool.
   * @default - no attribute mapping
   */
  readonly attributeMapping?: AttributeMapping;
}

export interface UserPoolIdentityProviderSamlProps {
  /**
   * The name of the provider. Must be between 3 and 32 characters.
   *
   * @default - the unique ID of the construct
   */
  readonly name?: string;
  /**
   * Identifiers
   *
   * Identifiers can be used to redirect users to the correct IdP in multitenant apps.
   *
   * @default - no identifiers used
   */
  readonly identifiers?: string[];
  /**
   * The SAML metadata.
   */
  readonly metadata: UserPoolIdentityProviderSamlMetadata;
  /**
   * Whether to enable the "Sign-out flow" feature.
   *
   * @default - false
   */
  readonly idpSignout?: boolean;
  /**
   * Mapping attributes from the identity provider to standard and custom attributes of the user pool.
   * @default - no attribute mapping
   */
  readonly attributeMapping?: AttributeMapping;
}
