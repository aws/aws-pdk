# Building your projects

## Build phases

Projen defines a standard way for building software through a fixed set of build phases. This is implemented via a set of tasks defined in the Project base class which all constructs extend from.

The `build` task contains a set of sub-tasks which represent the various build phases:

- **default** - responsible for running your projenrc and synthesizing all project files.
- **pre-compile** - runs before compilation (eg. bundle assets).
- **compile** - compiles your code (if needed).
- **post-compile** - runs immediately after a successful compilation.
- **test** - runs tests.
- **package** - creates a distribution package.

To extend the build process, components and projects can use `project.projectBuild.xxxTask` and interact with the Task object (for example, `project.projectBuild.postCompileTask.exec("echo hi")` will run `echo hi`` after compilation).

!!!note
    The build task itself is locked. This means that any attempt to extend it (i.e. call spawn, exec, reset, etc) will throw an exception. We recommend just extend one of the phases instead of extending the build. This ensures that phases are always executed in the right order.

_Sourced from: https://projen.io/build.html_

## Modifying tasks

### Adding a new task

To add a new task to a project, add the following in your `projenrc` file:

```typescript
const helloTask = project.tasks.addTask("hello");
helloTask.exec("echo world");
```

After you synthesize this change, you can call your task by executing `npx projen hello`.

!!!tip
    If you have the `pdk` CLI installed, you can also invoke your task by running `pdk hello`

### Changing a task

Resetting a task removes any commands which may have already been configured (for example default commands provided by the projen project being used). You can _reset_ a task as follows:

```typescript
const someTask = project.tasks.tryFind("<some-task>")?.reset();
someTask.exec('echo something');
someTask.spawn(someOtherTask);
```

This will make the `<some-task>` task a no-op. You can then add your own steps by calling `exec/spawn` on the task.

!!!tip
    The default phase tasks are available directly within the project as they always exist and can be referenced like `project.compileTask`.

## Full build

In order to perform a full build of your codebase, run the `npx projen build` command from the root of your monorepo. This will build each of your projects in the dependency order.

The `npx projen build` command is a convenience wrapper around an underlying `nx run-many --target=build --output-style=stream --nx-bail` command. You can pass in any options available in the [nx cli](https://nx.dev/packages/nx/documents/run-many), for example `npx projen build --parallel=10` will perform the build with up to 10 parallel processes.

## Targeted build

In order to perform a targeted build of a single package and its dependencies, run the `npx nx run <package-name>:build` command. This will build the `package-name` and all of its dependencies in the correct dependency order.