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
import * as path from "path";
import { UserIdentity } from "@aws-prototyping-sdk/identity";
import { StaticWebsite } from "@aws-prototyping-sdk/static-website";
import { SampleApi } from "api";
import { Stack, StackProps } from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new SampleApi(this, "Api");

    const userIdentity = new UserIdentity(this, "UserIdentity");

    userIdentity.identityPool.authenticatedRole.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["execute-api:Invoke"],
        resources: [api.api.arnForExecuteApi("*", "/*", "*")],
      })
    );

    new StaticWebsite(this, "Website", {
      websiteContentPath: path.join(__dirname, "../../website/build"),
      runtimeOptions: {
        jsonPayload: {
          region: this.region,
          apiUrl: api.api.urlForPath(),
          identityPoolId: userIdentity.identityPool.identityPoolId,
          userPoolId: userIdentity.userPool.userPoolId,
          userPoolWebClientId: userIdentity.userPoolClient!.userPoolClientId,
        },
      },
    });
  }
}
