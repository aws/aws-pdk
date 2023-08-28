# Your first AWS PDK Project

You've read [Getting started with the AWS PDK](index.md) and set up your development environment for writing AWS PDK projects? Great! Now let's see how it feels to work with the AWS PDK by building a complex PDK project.

In this tutorial, you'll learn about the following:

- The structure of a PDK project
- How to use PDK constructs to define a project structure
- How to synthesize and build PDK projects
- How to take advantage of build caching and visualize your project dependencies

The standard AWS PDK development workflow is similar to the standard Projen workflow you may already be familiar with:

1. Bootstrap your project by executing the `pdk new monorepo-[ts/py/java]` command
1. Define your project constructs within the `projenrc` file
1. Synthesize your projects by running the `pdk` command
1. Build your projects by running `pdk build`
1. Deploy your infrastructure to the AWS cloud

This tutorial walks you through creating the PDK Project from start to finish. The final application we create will comprise of a React based website, a Smithy API and the supporting CDK infrastructure to deploy it all.

We'll also show how to add a new API operation, implement an API handler, and wire it up in your infrastructure.

## Bootstrap your project

TODO