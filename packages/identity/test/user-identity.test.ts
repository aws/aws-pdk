/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
