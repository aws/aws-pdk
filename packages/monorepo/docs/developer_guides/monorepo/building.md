# Building your projects

## Build phases

Projen defines a standard way for building software through a fixed set of build phases. This is implemented via a set of tasks defined in the Project base class which all constructs extend from.

The `build` task spawns a set of sub-tasks which represent the various build phases:

**default** - this task is responsible to execute your projenrc and synthesize all project files.
**pre-compile** - runs before compilation (eg. bundle assets)
**compile** - compile your code (if needed)
**post-compile** - runs immediately after a successful compilation
**test** - runs tests
**package** - creates a distribution package

To extend the build process, components and projects can use project.projectBuild.xxxTask and interact with the Task object (i.e. project.projectBuild.postCompileTask.exec("echo hi") will execute echo hi after compilation).

!!!note
    The build task itself is locked. This means that any attempt to extend it (i.e. call spawn, exec, reset, etc) will throw an exception Instead of extending build, just extend one of the phases. This ensures that phases are always executed in the right order.

_Sourced from: https://projen.io/build.html_

## Modifying tasks

### Adding a new task

To add a new task to a project, add the following in your `projenrc` file:

```typescript
const helloTask = project.tasks.addTask("hello");
helloTask.exec("echo world");
```

After you synthesize this change, you will be able to call your task by executing `pdk hello`.

### Changing a task

There is no way to currently delete a task, however you can _reset_ a task as follows:

```typescript
const someTask = project.tasks.tryFind("<some-task>")?.reset();
someTask.exec('echo something');
someTask.spawn(someOtherTask);
```

This will make the `<some-task>` task a no-op. You can then add your own steps by calling `exec/spawn` on the task

!!!tip
    The default phase tasks are available directly within the project as they always exist and can be reference like `project.compileTask`.

## Full build

In order to perform a full build of your codebase, run the `pdk build` command from the root of your monorepo. This will build each of your projects in dependency order.

The `pdk build` command is a convenience wrapper around an underlying `nx run-many --target=build --output-style=stream --nx-bail` command. As such you can pass in any options available in the [nx cli](https://nx.dev/packages/nx/documents/run-many) for example `pdk build --parallel=10` will perform the build with up to 10 parallel processes.

## Targeted build

In order to perform a targeted build of a single package and it's dependencies, run the `pdk nx run <package-name>:build` command. This will build the `package-name` and all of it's dependencies in correct dependency order.