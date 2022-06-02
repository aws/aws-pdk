import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { UserIdentity } from "../src";

describe("User Identity Unit Tests", () => {
  it("Defaults", () => {
    const app = new App();
    const stack = new Stack(app);
    new UserIdentity(stack, "Defaults");

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
