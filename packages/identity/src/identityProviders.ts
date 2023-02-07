/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

export enum IdentityProviderName {
  APPLE = "apple",
  AMAZON = "amazon",
  FACEBOOK = "facebook",
  GOOGLE = "google",
  OIDC = "oidc",
  SAML = "saml",
}

// type Only<T, U> = {
//   [P in keyof T]: T[P];
// } & {
//   [P in keyof U]?: never;
// };

// export type Either<T, U> = Only<T, U> | Only<U, T>;

// interface IdentityProviderClientBase {
//   scopes?: Array<string>
//   attributeMapping?: AttributeMapping
// }

// interface IdentityProviderClients extends IdentityProviderClientBase {
//   clientId: string
//   clientSecret: string
// }

// interface IdentityProviderSecret extends IdentityProviderClientBase {
//   secretArn: string
// }

// export type IdentityProvider = Either<IdentityProviderClients,  IdentityProviderSecret>
