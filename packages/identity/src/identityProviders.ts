/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

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
