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
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { App, NestedStack, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { UserIdentity } from "../src";

describe("User Identity Unit Tests", () => {
  it("Defaults", () => {
    const stack = new Stack(PDKNag.app());
    new UserIdentity(stack, "Defaults");
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("Defaults - Nested", () => {
    const stack = new Stack(PDKNag.app());
    const nestedStack = new NestedStack(stack, "Nested-Stack");
    new UserIdentity(nestedStack, "Defaults-Nested");
    expect(Template.fromStack(nestedStack)).toMatchSnapshot();
  });

  it("User provided UserPool", () => {
    const app = new App();
    const stack = new Stack(app);
    const userPool = new UserPool(stack, "UserPool");
    const userIdentity = new UserIdentity(stack, "Defaults", {
      userPool,
    });
    expect(userPool.userPoolId).toEqual(userIdentity.userPool.userPoolId);
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
