# Contributing Guidelines

Thank you for your interest in contributing to the AWS PDK. Whether it's a bug report, new feature, correction, or additional documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary information to effectively respond to your bug report or contribution.

## Project Structure

The structure of this project is as follows:

### **docs**

This is where the documentation site is defined and built.

### **projenrc**

Contains configurations for each project within this monorepo.

!!!info
    As a rule of thumb, every package in the monorepo should correspond to a file in this directory.

### **packages**

Where each of the projects are synthesized.

### **packages/pdk**

A special 'uber' package which pulls in all of the other packages into a single distributable. This package should only ever have edits to `_scripts` as all content is dynamically created.

## Creating a new construct

Creating a new construct is a two step process:

1. Create and instantiate a new Project which extends `PDKProject` from the abstract directory (refer to other constructs for an example).
2. Write your code and tests.

### Creating a new Project

To create a new project, create a file in the `projects` directory called `<your-package>-project.ts`. Ensure `<your-package>` is the same name of the package you are creating to maintain consistency.

Create a new class as follows:

```ts
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../abstract/pdk-project";

export class MyPackageProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "<your name/org>",
      authorAddress: "<your email>",
      defaultReleaseBranch: "mainline",
      name: "your-package",
      repositoryUrl: "https://github.com/aws/aws-pdk",
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
      stability: Stability.EXPERIMENTAL, // New constructs should always be marked as EXPERIMENTAL
    });

    // any additional config here
  }
}
```

Please refer to existing projects for examples on full configuration.

Once your class is created, simply instantiate it within `.projenrc.ts` and run `pdk` from the root in order for it to be synthesized.

Any new project created **MUST** set the stability to `experimental`. This is to ensure the `@aws/pdk` package sets up correct submodule exports i.e: `import @aws/pdk/experimental/<new-package>;`. Once a sufficient enough period of time, tests, documentation and usage of this project has occured, it can be promoted to `stable` which will result in customers referencing `import @aws/pdk/<new-package>;`.

#### Note regarding dependencies

The jsii runtimes in non-javascript languages do not use `pnpm i`, and as a consequence cannot rely on `pnpm i` bringing in a packages dependencies. As a consequence, dependencies that are not themselves jsii modules, must also be referenced in the `bundledDependencies` section, so that they are bundled within the NPM package.

### Write your code and tests

At a minimum, your package should include a `index.ts` file which exports all of your public classes/constructs. Please refer to existing packages for reference.

Your package should also include a `docs/developer_guides/<your-package>/index.md` file which describes your constructs at a high level and optionally provide a tutorial on how to use it. This is very important as this content will be rendered on the docuemntation website and is the first port of call for end users.

If creating either a `scripts`, `samples` or `assets` folder within you package, please be sure to add a subdirectory underneath with you package name to ensure correct bundling of the uber package. For example: `scripts/<package-name>`.

In terms of testing, it is desired for each package to aim for a _minimum of 80% coverage_ in unit tests.

#### Testing CDK constructs

A simple way to test CDK constructs is to use snapshot testing as follows:

```ts
import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { MyConstruct } from "./my-construct";

describe("<MyPackage> Unit Tests", () => {
  it("<Some Test>", () => {
    const app = new App();
    const stack = new Stack(app);
    new MyConstruct(stack, "SomeTest", {...});

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
```

#### Testing Projen constructs

A simple way to test projen constructs is to use snapshot testing as follows:

```ts
import { synthSnapshot } from "projen/lib/util/synth";

describe("<MyPackage> Unit Tests", () => {
  it("<Some Test>", () => {
    const project = new MyPackageProject({...});
    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
```

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

- A reproducible test case or series of steps
- The version of our code being used (semver)
- Any modifications you've made relevant to the bug
- Anything unusual about your environment or deployment

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the _mainline_ branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Run `pdk build` to ensure everything builds and tests correctly.
   > This will execute `pnpm nx run-many --target=build --output-style=stream --nx-bail` to build all sub-projects in the workspace.
4. Commit to your fork on a new branch using [conventional commit messages](#commits).
5. Send us a pull request, answering any default questions in the pull request template.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional documentation on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Commits

This package utilizes [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and as such all commit messages will need to adopt this format. A `commit-msg` hook is installed as part of this package to enforce correct commit message structure and will be run anytime a `git commit ...` is executed.

[Commitizen](https://github.com/commitizen/cz-cli) has been installed for your convenience which provides a guided UI
for committing changes. To commit your changes run the following commands:

```bash
git add -A # stage your changes
pdk cz # launch commitizen
```

An interactive UI will be displayed which you can follow to get your change committed.

Package versioning is determined based on the semantic commit and as such it is very important this format is followed. A PR checker will also run to ensure the format of your commit message is compliant.

**Important:** Breaking changes should only ever apply to `stable` submodules (those marked STABLE). Whilst `experimental` submodules may have 'breaking changes', we should not treat them as such from a semVer perspective and instead just increment the minor version.

## Release schedule

The AWS PDK has a full-cd release pipeline. Assuming all tests and CI workflows succeed, you can expect a new release to be published to all package managers within ~10-15 minutes of a PR being merged.

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## Security issue notifications

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.

## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.

## FAQ

### How do I bump dependency versions?

From the root directory run: `pdk upgrade-deps`. This will bump all dependencies to be the same/latest versions and update the `pnpm-lock.yaml` file.

### Type mismatch

If you run into an issue that resembles:

```bash
Type 'import(".../@aws/pdk/node_modules/@aws/pdk/node_modules/projen/lib/ignore-file").IgnoreFile' is not assignable to type 'import(".../@aws/pdk/node_modules/projen/lib/ignore-file").IgnoreFile'.
Types have separate declarations of a private property '_patterns'.
```

This means there are two conflicting versions of a package in the monorepo. To resolve this, delete the `pnpm-lock.yaml` file and then from the root directory run: `pdk upgrade-deps`. This will bump all dependencies to be the same/latest versions and update the lock file accordingly.
