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
//  import { IdentityPool } from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Duration } from "aws-cdk-lib";
import {
  UserPoolIdentityProviderAmazon,
  UserPoolIdentityProviderApple,
  UserPoolIdentityProviderFacebook,
  UserPoolIdentityProviderGoogle,
  UserPoolIdentityProviderOidc,
  UserPoolIdentityProviderSaml,
  PasswordPolicy,
} from "aws-cdk-lib/aws-cognito";
import {
  AwsCustomResource,
  PhysicalResourceId,
  AwsCustomResourcePolicy,
} from "aws-cdk-lib/custom-resources";
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
import { UserIdentity, UserIdentityProps } from "./user-identity";

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

export interface IdpIdentityProps extends UserIdentityProps {
  readonly identityProviderProps?: IdentityProviderProps;
}

export class IdpIdentity extends UserIdentity {
  constructor(scope: Construct, id: string, readonly props: IdpIdentityProps) {
    super(scope, id);

    if (props?.identityProviderProps) {
      let SupportedIdentityProviders: Array<string> = ["COGNITO"];

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
            SupportedIdentityProviders.push("LoginWithAmazon");
            break;
          case IdentityProviderName.APPLE:
            provider = new UserPoolIdentityProviderApple(this, "Apple", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            SupportedIdentityProviders.push("SignInWithApple");
            break;
          case IdentityProviderName.FACEBOOK:
            provider = new UserPoolIdentityProviderFacebook(this, "Facebook", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            SupportedIdentityProviders.push("Facebook");
            break;
          case IdentityProviderName.GOOGLE:
            provider = new UserPoolIdentityProviderGoogle(this, "Google", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            SupportedIdentityProviders.push("Google");
            break;
          case IdentityProviderName.OIDC:
            provider = new UserPoolIdentityProviderOidc(this, "Oidc", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            SupportedIdentityProviders.push(identityProviderProps.name);
            break;
          case IdentityProviderName.SAML:
            provider = new UserPoolIdentityProviderSaml(this, "Saml", {
              ...identityProviderProps,
              userPool: this.userPool,
            });
            SupportedIdentityProviders.push(identityProviderProps.name);
            break;
          default:
            throw new Error("Unsupported IDP type");
        }
        new AwsCustomResource(this, "updateIdpSupportInUserPoolApp", {
          onUpdate: {
            service: "Cognito",
            action: "UpdateUserPoolClient",
            parameters: {
              ClientId: this.userPoolClient?.userPoolClientId,
              UserPoolIed: this.userPool.userPoolId,
              SupportedIdentityProviders: SupportedIdentityProviders,
            },
            physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
          },
          policy: AwsCustomResourcePolicy.fromSdkCalls({
            resources: AwsCustomResourcePolicy.ANY_RESOURCE,
          }),
        });

        this.userPoolClient?.node.addDependency(provider);
      }
    }
  }
}
