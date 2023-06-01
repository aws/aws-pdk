/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
//import { SynthUtils } from "@aws-cdk/assert";
import { PDKNag, AwsPrototypingChecks } from "@aws-prototyping-sdk/pdk-nag";
import { NestedStack, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { GeoRestriction } from "aws-cdk-lib/aws-cloudfront";
import { NagSuppressions } from "cdk-nag";
import { StaticWebsite, StaticWebsiteOrigin } from "../src";

describe("Static Website Unit Tests", () => {
  it("Defaults", () => {
    const stack = new Stack(PDKNag.app());
    new StaticWebsite(stack, "Defaults", {
      websiteContentPath: path.join(__dirname, "./sample-website"),
    });

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("Defaults - using AwsPrototyping NagPack", () => {
    const app = PDKNag.app({ nagPacks: [new AwsPrototypingChecks()] });
    const stack = new Stack(app);

    new StaticWebsite(stack, "Defaults", {
      websiteContentPath: path.join(__dirname, "./sample-website"),
    });

    app.synth();

    const message = app
      .nagResults()
      .flatMap((r) => r.messages.map((m) => m.messageDescription))
      .find((desc) =>
        desc.startsWith("AwsPrototyping-CloudFrontDistributionGeoRestrictions:")
      );

    expect(message).toBeTruthy();
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("Defaults with suppression rule - using AwsPrototyping NagPack", () => {
    const app = PDKNag.app({ nagPacks: [new AwsPrototypingChecks()] });
    const stack = new Stack(app);

    new StaticWebsite(stack, "Defaults", {
      websiteContentPath: path.join(__dirname, "./sample-website"),
    });

    NagSuppressions.addResourceSuppressions(
      stack,
      [
        {
          id: "AwsPrototyping-CloudFrontDistributionGeoRestrictions",
          reason: "This is a supression reason",
        },
      ],
      true
    );

    app.synth();

    const message = app
      .nagResults()
      .flatMap((r) => r.messages.map((m) => m.messageDescription))
      .find((desc) =>
        desc.startsWith("AwsPrototyping-CloudFrontDistributionGeoRestrictions:")
      );

    expect(message).not.toBeTruthy();
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("Defaults and Geoblocking - using AwsPrototyping NagPack", () => {
    const app = PDKNag.app({ nagPacks: [new AwsPrototypingChecks()] });
    const stack = new Stack(app);

    new StaticWebsite(stack, "Defaults", {
      websiteContentPath: path.join(__dirname, "./sample-website"),
      distributionProps: {
        defaultBehavior: { origin: StaticWebsiteOrigin },
        geoRestriction: GeoRestriction.allowlist("AU", "SG"),
      },
    });

    app.synth();

    const message = app
      .nagResults()
      .flatMap((r) => r.messages.map((m) => m.messageDescription))
      .find((desc) =>
        desc.startsWith("AwsPrototyping-CloudFrontDistributionGeoRestrictions:")
      );

    expect(message).not.toBeTruthy();
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

  it("Disable Web ACL", () => {
    const stack = new Stack(PDKNag.app());
    new StaticWebsite(stack, "WithoutWebAcl", {
      websiteContentPath: path.join(__dirname, "sample-website"),
      webAclProps: {
        disable: true,
      },
    });

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
