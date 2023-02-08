/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { App, NestedStack, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import {
  UserPool,
  UserPoolClientIdentityProvider,
} from "aws-cdk-lib/aws-cognito";
import { IdpIdentity, UserIdentity } from "../src";

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

describe("Idp Identity Unit Tests", () => {
  it("Defaults", () => {
    const stack = new Stack(PDKNag.app());
    const idp = new IdpIdentity(stack, "idp-identity-test-10", {
      cognitoDomain: {
        domainPrefix: "test-idp-10",
      },
      identityProviders: {
        google: {
          clientId:
            "180033079154-ortdes3678qaith4m7d9pjv2vq0q7bku.apps.googleusercontent.com",
          clientSecret: "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",
        },
        amazon: {
          clientId:
            "180033079154-ortdes3678qaith4m7d9pjv2vq0q7bku.apps.googleusercontent.com",
          clientSecret: "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",
        },
      },
    });

    idp.addClientApplication("web", {
      callbackUrls: ["https://localhost:8080"],
      logoutUrls: ["https://localhost:8080/logout"],
      useIdentityProvider: [UserPoolClientIdentityProvider.GOOGLE],
    });

    idp.addClientApplication("mobile", {
      callbackUrls: ["https://localhost:8080"],
      logoutUrls: ["https://localhost:8080/logout"],
      useIdentityProvider: [UserPoolClientIdentityProvider.AMAZON],
    });
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
