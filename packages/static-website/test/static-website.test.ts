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
import path from "path";
import { UserIdentity } from "@aws-prototyping-sdk/identity";
import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { RuntimeOptions, StaticWebsite } from "../src";

describe("Static Website Unit Tests", () => {
  it("Defaults", () => {
    const app = new App();
    const stack = new Stack(app);
    new StaticWebsite(stack, "Defaults", {
      websiteContentPath: path.join(__dirname, "./sample-website"),
    });

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("RuntimeConfig - Defaults", () => {
    const app = new App();
    const stack = new Stack(app);
    const userIdentity = new UserIdentity(stack, "UserIdentity");
    const runtimeOptions = RuntimeOptions.fromUserIdentity(stack, userIdentity);
    expect(runtimeOptions).toMatchSnapshot();
  });

  it("RuntimeConfig - Custom UserPool", () => {
    const app = new App();
    const stack = new Stack(app);
    const providedUserIdentity = new UserIdentity(
      stack,
      "ProvidedUserIdentity"
    );
    const userIdentity = new UserIdentity(stack, "UserIdentity", {
      userPool: providedUserIdentity.userPool,
    });
    const runtimeOptions = RuntimeOptions.fromUserIdentity(stack, userIdentity);
    expect(runtimeOptions.userPoolId).toEqual(
      providedUserIdentity.userPool.userPoolId
    );
    expect(runtimeOptions.userPoolWebClientId).toEqual(
      providedUserIdentity.userPoolClient?.userPoolClientId
    );
    expect(runtimeOptions).toMatchSnapshot();
  });

  it("RuntimeConfig - Unknown UserPoolClient", () => {
    const app = new App();
    const stack = new Stack(app);
    const userPool = new UserPool(stack, "UserPool");
    const userIdentity = new UserIdentity(stack, "UserIdentity", {
      userPool,
    });

    expect(() =>
      RuntimeOptions.fromUserIdentity(stack, userIdentity)
    ).toThrowErrorMatchingSnapshot();
  });
});
