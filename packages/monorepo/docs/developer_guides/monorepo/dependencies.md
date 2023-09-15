# Dependencies

Dependencies are an intrinsic part of every software project.

The `Dependencies` component is responsible to track the list of dependencies a project has, and then used by project types as the model for rendering project-specific dependency manifests such as the dependencies section `package.json`, `pom.xml` or `pyproject.toml` files.

To add a dependency, use a project-type specific API such as `nodeProject.addDeps()` or use the generic API `project.deps`:

```typescript
project.deps.addDependency(dep, type);
```

By default, `pdk` will automatically install dependencies in your project if they are not already installed. You can also install your dependencies manually by running `pdk install` from the root of your monorepo.

## Semantic requirements

The first argument (dep) is a string in the form MODULE@VERSION where MODULE is the package-manager specific name of the dependency (for node projects, this is the npm module name) and VERSION is an optional semantic version requirement (for example, @^7).

## Dependency types

The second argument (type) defines the dependency type and is one of:

- *_DependencyType.RUNTIME:_* The dependency is required for the program/library during runtime.
- *_DependencyType.PEER:_* The dependency is required at runtime but only a single copy of the module must exist in the dependency closure of the consumer. In most package managers (PyPI, NuGet, Maven) there is no difference between runtime and peer dependencies (since all dependencies are installed as peers), but in npm, this is an important distinction. Prior to npm@7, peer dependencies must be installed explicitly by consumers.
- *_DependencyType.BUNDLED:_* A runtime dependency that is bundled and shipped with the module, so consumers are not required to install it.
- *_DependencyType.BUILD:_* The dependency is required to run the build task.
- *_DependencyType.TEST:_* The dependency is required to run the test task.
- *_DependencyType.DEVENV:_* The dependency is required for development (e.g. IDE plugins).

_Sourced from: https://projen.io/deps.html_