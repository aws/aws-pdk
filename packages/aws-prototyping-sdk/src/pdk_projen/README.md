## pdk_projen

This package contains a set of [Projen](https://github.com/projen/projen) project types which can be used to
configure complex project configuration through code.

These project types synthesize project configuration files such as package.json, .gitignore, nx.json, eslint, jest, etc
from well-typed definitions.

## Prerequisites

Ensure you have the following packages installed globally:

* [node > 14](https://nodejs.org/en/download/package-manager/) (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install)

## Getting Started

To create a new project, run the following command and follow the instructions for the specific project type below:

```shell
mkdir my-project
cd my-project
npx projen new --from aws-prototyping-sdk <project-type>
```

The following are the currently supported project types, along with instructions on how to get started:

* [nx-monorepo](#nx-monorepo) - Vends a [NX](https://github.com/nrwl/nx) based monorepo with support for 
polygot builds.

## nx-monorepo

The `nx-monorepo` project type will bootstrap a [NX](https://github.com/nrwl/nx) based monorepo with support for
polygot builds, build caching, dependency graph visualization and much more.

This project type does the heavy lifting of managing your packages/subprojects to be compatible with NX by performing
the following actions:

* Generates an `nx.json` file in the root directory which is responsible for configuring project defaults including
what targets should be cached, what implicit dependencies there are, etc.
* Generate a `package.json` for any non-node project. This is needed as a facade so that nx can call a target, regardless
of language. All targets in this package.json file defer to projen tasks.
* Installs a plugin (owned by pdk) which handles polygot dependency linking.

After running the `npx projen new --from aws-prototyping-sdk nx-monorepo` command, a `.projenrc.ts` will be created which
looks like this:

```ts
import { pdk_projen } from "aws-prototyping-sdk";

const project = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["aws-prototyping-sdk"],
  name: "my-project",
});

project.synth();
```

This will be the main mechanism for adding new subprojects, configuring/changing aspects of the generated
packages, etc.

### Adding Subprojects

Now that you have a monorepo set up, it's time to add Subprojects. You can add Subprojects by simply
instantiating new instances of classes which extend the native Projen's
[Project](https://github.com/projen/projen/blob/main/src/project.ts) class, and providing the monorepo project as a 
[parent](https://projen.io/api/API.html#projen-project).

Examples of currently supported project types are listed on the 
[Projen Github Website](https://github.com/projen/projen#getting-started).

#### Example 1 - Explicit dependencies

NX ships pre-configured to detect explicit dependencies within the package.json files of Sub projects. If your
use case relies solely on Typescript then this example will apply to you.

Let's create a sample application with two Subprojects:

1. An Infrastructure project based on Typescript which creates some basic CDK infrastructure.
2. A React webapp written in Typescript.

```ts
import { pdk_projen } from "aws-prototyping-sdk";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
import { ReactTypeScriptProject } from "projen/lib/web";

const project = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["aws-prototyping-sdk"],
  name: "my-project",
});

const webapp = new ReactTypeScriptProject({
  defaultReleaseBranch: "mainline",
  name: "webapp",
  parent: project,
  outdir: "packages/webapp",
});

new AwsCdkTypeScriptApp({
  cdkVersion: "2.0.0",
  defaultReleaseBranch: "mainline",
  name: "infra",
  devDeps: [webapp.package.packageName], // CDK App depends on the webapp
  parent: project,
  outdir: "packages/infra",
});

project.synth();
```

**It is important to note that both the `parent` and `outdir` properties are mandatory.**

Now from the root directory, we will synthesize these packages by running `npx projen`. After
running this command we will notice our directory will resemble the following:

```
root
  |- packages
        |- infra
        |- webapp
```

The `npx projen` command would have also linked these two packages by adding a dev dependency to webapp in infra's
package.json and also updating the `workspace` property in the root package.json.

If we wanted to build infra, we can run the following command: `npx nx build infra`.

```shell
 npx nx build infra

 >  NX   Running target build for project infra and 1 task(s) it depends on

 —————————————————————————————————————————————————————————————————————————————————
 > nx build webapp
 ...
 Done in 12.06s.

 > nx build infra
 ...
 Done in 25.59s.
 
 —————————————————————————————————————————————————————————————————————————————————

 >  NX   Successfully ran target build for project infra

```

As you can see from the above logs, the webapp build target was executed first as this is a dependency
of infra. NX will also cache builds, so if the same command is re-run (without modifying anything) you will notice the 
build completes in a fraction of the time.

#### Example 2 - Implicit dependencies

Some project require implementing components in different languages and as such a mechanism must exist
to declare implicit build dependencies between these various packages.

Let's extend the previous example by adding an additional python based lambda as follows:

```ts
import { pdk_projen } from "aws-prototyping-sdk";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
import { ReactTypeScriptProject } from "projen/lib/web";
import { PythonProject } from "projen/lib/python";

const project = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["aws-prototyping-sdk"],
  name: "my-project",
});

const webapp = new ReactTypeScriptProject({
  defaultReleaseBranch: "mainline",
  name: "webapp",
  parent: project,
  outdir: "packages/webapp",
});

const infra = new AwsCdkTypeScriptApp({
  cdkVersion: "2.0.0",
  defaultReleaseBranch: "mainline",
  name: "infra",
  devDeps: [webapp.package.packageName], // CDK App depends on the webapp
  parent: project,
  outdir: "packages/infra",
});

const lambda = new PythonProject({
  authorEmail: "foo@bar.com",
  authorName: "foo bar",
  moduleName: "python_lambda",
  name: "python_lambda",
  version: "0.0.0",
  parent: project,
  outdir: "packages/python_lambda",
});

project.addImplicitDependency(infra, lambda);

project.synth();
```

Now from the root directory, we will synthesize these packages by running `npx projen`. After
running this command we will notice our directory will resemble the following:

```
root
  |- packages
        |- infra
        |- webapp
        |- lambda
```

If we wanted to build infra, we can run the following command: `npx nx run infra:build`.

```shell
 npx nx build infra
 
 >  NX   Running target build for project infra and 2 task(s) it depends on
 ———————————————————————————————————————————————————————————————————————————————
 
 > nx build python_lambda
 ...
 Done in 0.62s.
 
 > nx build webapp
 ...
 Done in 10.79s.
 
 > nx build infra
 ...
 Done in 22.65s.
 
 —————————————————————————————————————————————————————————————————————————————————

 >  NX   Successfully ran target build for project infra
```

As you can see from the above logs, the build was executed sequentially for each package in the correct
order.

### FAQ

#### How do I run a target just on a specific package?

To run a package specific target, you can do the following:

```shell
cd packages/<my-package>
npx projen <target>
```

#### How do I add a new target to a projen Sub Project?

In your `.projenrc.ts`, do the following:

```ts
const infra = new AwsCdkTypeScriptApp({
  cdkVersion: "2.0.0",
  defaultReleaseBranch: "mainline",
  name: "infra",
  devDeps: [webapp.package.packageName], // CDK App depends on the webapp
  parent: project,
  outdir: "packages/infra",
});

infra.addTask("new-target", {
  exec: "echo \"hi\""
});
```

As usual, ensure you run `npx projen` in the root directory to synthesize your change.

From here is it just a case of executing `npx projen new-target` in the package directory. 

#### I have added a project in .projenrc.ts but it isn't synthesizing?

1. Ensure that the `parent` property of the project is set to the monorepo project.
2. Ensure that an `outdir` is configured i.e: `packages/mypackage`.
3. run `npx projen` in the root of the monorepo.

#### How do I visualize my dependencies?

From the root of the monorepo run `npx nx graph`. This will open a browser showing how all your packages are related.

#### I have updated a dependency, however the build or graph viz is not detecting any changes.

1. Ensure you have run `npx projen` from the root of the monorepo.
2. Sometimes the nx cache can become stale and can be cleared by running `npx nx clear-cache`.

#### How do I build everything in my monorepo without a specific target package?

`npx nx run-many --target=build --all`

#### I am running a different target, however the dependencies are not being executed.

By default, only the `build` target is configured to rely on it's dependencies. To configure additional targets, update 
the NXMonorepoProject as follows:

```ts
const project = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["aws-prototyping-sdk"],
  name: "my-project",
  targetDependencies: {
    test: [
      {
        target: "test",
        projects: "dependencies",
      }
    ]
  }
});
```

In this example, the test target will now wait until the test target has run successfully in all dependent projects.

#### My subproject is not caching even though I haven't changed anything.

This can happen if NX detects changes in generated/compiled files. Examples of this include if your build
target creates a zip file or generates test artifacts with timestamps. To resolve this, add an nxIgnore pattern as follows:

```ts
const project = new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["aws-prototyping-sdk"],
  name: "my-project",
  nxIgnorePatterns: ["generated-tst", "dist"]
});
```

As per the above configuration, NX will ignore anything within `generated-tst` or `dist` folders within any
package in your monorepo.
