# Monorepo

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/monorepo/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/monorepo)

> Simplify the management of multiple packages within a polyglot monorepo

The `monorepo` submodule provides several projen project types in either Typescript, Python or Java that can configure a [NX](https://nx.dev/getting-started/intro) monorepo to manage all your packages. When used, these project types enable polyglot builds, declarative dependency management, build caching, dependency visualization and other features.

The AWS PDK itself uses the `monorepo` submodule and is a good reference for seeing how to set up a complex, polyglot monorepo.

## How does it work?

The construct will set up your root project to function as a Monorepo using [NX](https://nx.dev/getting-started/intro), and manage all of the NX configuration for you by default. Depending on the language you decide to bootstrap your project with, a `projenrc` file in your preferred language  allows you to add new sub-packages to your project to be managed by NX.

The default structure of your project will be created with the following key files as shown:

=== "TS"

    ```
    node_modules/   -- installed dependencies
    nx.json         -- nx configuration (this file is managed by projen)
    package.json    -- dependency declarations (this file is managed by projen)
    .projenrc.ts    -- where your packages are defined
    yarn.lock       -- pinned dependencies
    ```

=== "PYTHON"

    ```
    node_modules          -- needed as NX is deployed via npm
    nx.json               -- nx configuration (this file is managed by projen)
    package.json          -- nx dependency declaration (do not delete)
    pnpm-lock.yaml        -- pinned nx dependency declaration (do not delete)
    pyproject.toml        -- declared pypi dependencies (this file is managed by projen)
    ```

    !!!note
        For Python projects, the PDK enforces Poetry as the package manager in order for certain pieces of functionality to work.

=== "JAVA"

    ```
    node_modules          -- needed as NX is deployed via npm
    nx.json               -- nx configuration (this file is managed by projen)
    package.json          -- nx dependency declaration (do not delete)
    pnpm-lock.yaml        -- pinned nx dependency declaration (do not delete)
    pom.xml               -- declared maven dependencies (this file is managed by projen)
    src/
      test/
        java/
          projenrc.java   -- where your packages are defined
    ```

!!!note
    For non-ts monorepos, yarn is still used as a package manager at the root level in order for homogenous typescript -> typescript dependencies to work. For example, when you have a python monorepo with two typescript based projects that depend on each other.

## Getting started

This section describes how to get started with the `monorepo` construct. For more information, refer to the developer guides for particular features of this construct.

### Create your monorepo project

To get started, run the following command in an empty directory to create your Monorepo project:

=== "TS"

    ```bash
    npx projen new --from @aws/pdk monorepo-ts
    ```

    This will bootstrap your project given the above structure and contain the _.projenrc.ts_ file with your project definition which should contain the following:

    ```ts
    import { MonorepoTsProject } from "@aws/pdk/monorepo";
    const project = new MonorepoTsProject({
      defaultReleaseBranch: "main",
      name: "ts-bootstrap",
      projenrcTs: true,
    });
    project.synth();
    ```

=== "JAVA"

    ```bash
    npx projen new --from @aws/pdk monorepo-java
    ```

    This will bootstrap your project given the above structure and contain the _projenrc.java_ file with your project definition which should contain the following:

    ```java
    import software.aws.awspdk.monorepo.MonorepoJavaProject;
    import software.aws.awspdk.monorepo.MonorepoJavaOptions;

    public class projenrc {
        public static void main(String[] args) {
            MonorepoJavaProject project = new MonorepoJavaProject(MonorepoJavaOptions.builder()
                .name("java-bootstrap")
                .build());
            project.synth();
        }
    }
    ```

=== "PYTHON"

    ```bash
    npx projen new --from @aws/pdk monorepo-py
    ```

    This will bootstrap your project given the above structure and contain the _.projenrc.py_ file with your project definition which should contain the following:

    ```python
    from aws_pdk.monorepo import MonorepoPythonProject

    project = MonorepoPythonProject(
        dev_deps=["@aws/pdk/monorepo"],
        module_name="py_bootstrap",
        name="py-bootstrap",
    )

    project.synth()
    ```

    !!! bug
        You can remove `@aws/pdk/monorepo` from _dev_deps_ as this is incorrectly added by Projen due to a bug in their bootstrapping process.

!!!tip
    You can also pass in options parameters into the `npx projen new` command. For example, if you want to bootstrap a typescript monorepo with PNPM as the default package manager you could do: `npx projen new --from @aws/pdk monorepo-ts --package-manager=pnpm`. You can pass all the attributes available within the construct as options in a _kebab-case_ format.

## Synthesizing your project(s)

Whenever you make a change to the `projenrc` file, you will need to re-synthesize your project by running `npx projen` from the root directory. This will re-generate any projen managed files i.e: _nx.json_, eslint, etc.

For more information, refer to [synthesis](./synthesis.md).
