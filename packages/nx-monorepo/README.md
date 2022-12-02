The nx-monorepo package vends a NxMonorepoProject Projen construct that adds [NX](https://nx.dev/getting-started/intro) monorepo support and manages your yarn/npm/pnpm workspaces on your behalf. This construct enables polyglot builds (and inter language build dependencies), build caching, dependency visualization and much, much more.

The PDK itself uses the nx-monorepo project itself and is a good reference for seeing how a complex, polyglot monorepo can be set up.

> **BREAKING CHANGES** (pre-release)
> - v0.13.0: `WorkspaceConfig.nxConfig` type `NxConfig => Nx.WorkspaceConfig`, and `overrideProjectTargets` removed in favor of `PDKProject.nx` config to manage Nx project configurations. See [PR 231](https://github.com/aws/aws-prototyping-sdk/pull/231).

To get started simply run the following command in an empty directory:

```bash
npx projen new --from aws-prototyping-sdk nx-monorepo
```

This will bootstrap a new Projen monorepo and contain the following in the .projenrc.ts:

```ts
import { nx_monorepo } from "aws-prototyping-sdk";

const project = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
  deps: ["aws-cdk-lib", "constructs", "cdk-nag"],
  devDeps: ["aws-prototyping-sdk"],
  name: "my-package",
});

project.synth();
```

To add new packages to the monorepo, you can simply add them as a child to the monorepo. To demonstrate, lets add a PDK Pipeline TS Project as a child as follows:

```ts
import { nx_monorepo } from "aws-prototyping-sdk";

const project = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
  deps: ["aws-cdk-lib", "constructs", "cdk-nag"],
  devDeps: ["aws-prototyping-sdk"],
  name: "my-package",
});

new PDKPipelineTsProject({
  parent: project,
  outdir: "packages/cicd",
  defaultReleaseBranch: "mainline",
  name: "cicd",
  cdkVersion: "2.1.0"
});

project.synth();
```

Once added, run `npx projen` from the root directory. You will now notice a new TS package has been created under the packages/cicd path.

Now let's add a python project to the monorepo and add an inter-language build dependency.

```ts
import { nx_monorepo } from "aws-prototyping-sdk";
import { PDKPipelineTsProject } from "aws-prototyping-sdk/pipeline";
import { PythonProject } from "projen/lib/python";

const project = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
  deps: ["aws-cdk-lib", "constructs", "cdk-nag"],
  devDeps: ["aws-prototyping-sdk"],
  name: "test",
});

const pipelineProject = new PDKPipelineTsProject({
  parent: project,
  outdir: "packages/cicd",
  defaultReleaseBranch: "mainline",
  name: "cicd",
  cdkVersion: "2.1.0"
});

// Standard Projen projects also work here
const pythonlib = new PythonProject({
  parent: project,
  outdir: "packages/pythonlib",
  authorEmail: "",
  authorName: "",
  moduleName: "pythonlib",
  name: "pythonlib",
  version: "0.0.0"
});

// Pipeline project depends on pythonlib to build first
project.addImplicitDependency(pipelineProject, pythonlib);

project.synth();
```

Run `npx projen` from the root directory. You will now notice a new Python package has been created under packages/pythonlib.

To visualize our dependency graph, run the following command from the root directory: `npx nx graph`.

Now lets test building our project, from the root directory run `npx nx run-many --target=build --all`. As you can see, the pythonlib was built first followed by the cicd package.

The NxMonorepoProject also manages your yarn/pnpm workspaces for you and synthesizes these into your package.json pnpm-workspace.yml respectively.

For more information on NX commands, refer to this [documentation](https://nx.dev/using-nx/nx-cli).

### Homogenous Dependencies

As well as adding implicit dependencies, you can add dependencies between projects of the same language in order to have one project consume another project's code.

#### Typescript

Since the `NxMonorepoProject` manages a yarn/npm/pnpm workspace, configuring dependencies between Typescript projects is as straightforward as referencing them in `deps`.

Note that dependencies cannot be added in the same project synthesis (`npx projen`) as when projects are created. This means a two-pass approach is recommended, first to create your new projects, and then to add the dependencies.

For example:

First add your new projects:

```ts
new TypeScriptProject({
  parent: monorepo,
  outdir: "packages/a",
  defaultReleaseBranch: "main",
  name: "project-a"
});

new TypeScriptProject({
  parent: monorepo,
  outdir: "packages/b",
  defaultReleaseBranch: "main",
  name: "project-b",
});
```

Synthesise, then you can set up your dependency:

```ts
const a = new TypeScriptProject({
  parent: monorepo,
  outdir: "packages/a",
  defaultReleaseBranch: "main",
  name: "project-a"
});

new TypeScriptProject({
  parent: monorepo,
  outdir: "packages/b",
  defaultReleaseBranch: "main",
  name: "project-b",
  // B depends on A
  deps: [a.package.packageName],
});
```

#### Python

The recommended way to configure dependencies between python projects within your monorepo is to use a single shared virtual environment. You can then install packages you wish to depend on into that environment using pip's [Editable Installs](https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs).

You will also need to add an implicit dependency to tell the monorepo the correct build order for your packages.

For example:

```ts
const sharedEnv: VenvOptions = {
  envdir: '../../.env',
};

const a = new PythonProject({
  parent: monorepo,
  outdir: 'packages/a',
  moduleName: 'a',
  name: 'a',
  authorName: 'jack',
  authorEmail: 'me@example.com',
  version: '1.0.0',
  venvOptions: sharedEnv,
});

// Install A into the virtual env since it is consumed by B
a.tasks.tryFind('install')!.exec('pip install --editable .');

const b = new PythonProject({
  parent: monorepo,
  outdir: 'packages/b',
  moduleName: 'b',
  name: 'b',
  authorName: 'jack',
  authorEmail: 'me@example.com',
  version: '1.0.0',
  venvOptions: sharedEnv,
  // B depends on A
  deps: [a.moduleName],
});

// Add the implicit dependency so that the monorepo will build A before B
monorepo.addImplicitDependency(b, a);
```

#### Java

The recommended way to configure dependencies between java projects within your monorepo is to use shared maven repositories. The default java project build will already create a distributable in the correct format for a maven repository in its `dist/java` folder, so you can use this as a repository.

For example:

```ts
const a = new JavaProject({
  parent: monorepo,
  outdir: 'packages/a',
  groupId: 'com.mycompany',
  artifactId: 'a',
  name: 'a',
  version: '1.0.0',
});

const b = new JavaProject({
  parent: monorepo,
  outdir: 'packages/b',
  groupId: 'com.mycompany',
  artifactId: 'b',
  name: 'b',
  version: '1.0.0',
  // Declare the dependency on A
  deps: [`${a.pom.groupId}/${a.pom.artifactId}@${a.pom.version}`],
});

// Add the repository
b.pom.addRepository({
  url: 'file://../a/dist/java',
  id: 'dependency-on-a',
});

// Add the implicit dependency to control build order
monorepo.addImplicitDependency(b, a);
```
