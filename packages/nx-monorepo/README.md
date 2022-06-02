The nx-monorepo package vends a NxMonorepoProject Projen construct that adds [NX](https://nx.dev/getting-started/intro) monorepo support and manages your yarn/npm/pnpm workspaces on your behalf. This construct enables polygot builds (and inter language build dependencies), build caching, dependency visualization and much, much more.

The PDK itself uses the nx-monorepo project itself and is a good reference for seeing how a complex, polygot monorepo can be set up.

To get started simply run the following command in an empty directory:

```bash
npx projen new --from aws-prototyping-sdk nx-monorepo
```

This will boostrap a new Projen monorepo and contain the following in the .projenrc.ts:

```ts
import { nx_monorepo } from "aws-prototyping-sdk";

const project = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
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

Now lets add a python project to the monorepo and add a inter-language build dependency.

```ts
import { nx_monorepo } from "aws-prototyping-sdk";
import { PDKPipelineTsProject } from "aws-prototyping-sdk/pipeline";
import { PythonProject } from "projen/lib/python";

const project = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
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



