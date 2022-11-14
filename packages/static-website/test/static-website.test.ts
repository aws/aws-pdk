/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { NestedStack, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { StaticWebsite } from "../src";

describe("Static Website Unit Tests", () => {
  it("Defaults", () => {
    const stack = new Stack(PDKNag.app());
    new StaticWebsite(stack, "Defaults", {
      websiteContentPath: path.join(__dirname, "./sample-website"),
    });

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("Defaults - Nested", () => {
    const stack = new Stack(PDKNag.app());
    const nestedStack = new NestedStack(stack, "Nested-Stack");
    new StaticWebsite(nestedStack, "Defaults", {
      websiteContentPath: path.join(__dirname, "./sample-website"),
    });

    expect(Template.fromStack(nestedStack)).toMatchSnapshot();
  });
});
