import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { StaticWebsite } from "../src";

describe("Static Website Unit Tests", () => {
  it("Defaults", () => {
    const app = new App();
    const stack = new Stack(app);
    new StaticWebsite(stack, "Defaults", {
      websiteContentPath: ".",
    });

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
