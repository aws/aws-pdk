# Creating a new construct

Creating a new construct is a two-step process:

1. Create and instantiate a new project which extends `PDKProject`.
2. Write your code and tests.

## Create a new project

To create a new project,

1. In the `projects` directory, create a file called `<your-package>-project.ts`. To be consistent, make sure `<your-package>` is the same name as the package you are creating.

2. Create a new class as follows:

```ts
import { PDKProject } from "../private/pdk-project";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";

export class MyPackageProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "<your name/org>",
      authorAddress: "<your email>",
      defaultReleaseBranch: "mainline",
      name: "your-package",
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen"],
      deps: [
        "projen",
        "aws-cdk-lib", // Only needed if writing a CDK construct
        "constructs",
      ],
      peerDeps: [
        "projen",
        "aws-cdk-lib", // Only needed if writing a CDK construct
        "constructs", // Only needed if writing a CDK construct
      ],
      bundledDeps: [
        // include any non-jsii deps here
      ],
      stability: Stability.EXPERIMENTAL,
    });

    // any additional config here
  }
}
```

3. Once your class is created, instantiate it within `.projenrc.ts` and run `pnpm projen` from the root in order for it to be synthesized.

!!! Note
  
    For any new project created, set the stability to `experimental`, to ensure the `aws-prototyping-sdk` package maintains only stable code. After a sufficient period of time, tests, documentation, and usage of this project, you can change the stability to `stable`.

### Referencing dependencies

The jsii runtimes in non-javascript languages do not use `pnpm i`, and so cannot rely on `pnpm i` bringing in packages dependencies. You must reference dependencies that are not jsii modules in the `bundledDependencies` section, so that they are bundled within the NPM package.

## Write your code and tests

At a minimum, your package should include a `index.ts` file which exports all of your public classes/constructs. For more information. refer to existing packages for guidance.

Your package should also include a `README.md` file which describes your constructs at a high level and optionally provide a tutorial on how to use it. This is important as this content will be rendered on the docuemntation website and is the first port of call for your users.

In terms of testing, we recommend aiming for a _minimum of 80% coverage_ in unit tests for each package.

### Testing CDK constructs

To test CDK constructs, use snapshot testing. For example,

```ts
import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";

describe("<MyPackage> Unit Tests", () => {
  it("<Some Test>", () => {
    const app = new App();
    const stack = new Stack(app);
    new MyConstruct(stack, "SomeTest", {...});

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
```

### Testing projen constructs

To test projen constructs, use snapshot testing. For example,

```ts
import { synthSnapshot } from "projen/lib/util/synth";

describe("<MyPackage> Unit Tests", () => {
  it("<Some Test>", () => {
    const project = new MyPackageProject({...});
    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
```
