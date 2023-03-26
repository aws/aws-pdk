# aws-prototyping-sdk

AWS Prototyping SDK (PDK) is a package which contains useful CDK and Projen constructs.

## Getting Started

Ensure you have the following packages installed globally:

* [pnpm](https://pnpm.io/installation)
* [node > 14](https://nodejs.org/en/download/package-manager/) (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install)
* [Python >= 3.7](https://www.python.org/downloads/)
* [Java >= 8](https://aws.amazon.com/fr/corretto/) and [Maven >= 3.6](https://maven.apache.org/download.cgi)

```bash
# from root directory of this package
pnpm i
```

## Usage of projen/nx

This package is built using [projen](https://github.com/projen/projen) and [nx](https://nx.dev/getting-started/intro) as such all tasks should be invoked
via either:

- `pnpm nx run-many --target=<task> --all` - executes the `<task>` on every package, in dependency order.
- `pnpm nx run <package_name>:<task>` - executes the `<task>` on the specified `<package_name>`.

To build the full project, run `pnpm nx run-many --target=build --all`

Any change to `projects/*` or `.projenrc.ts` requires a synth to be executed. To do this, run: `pnpm projen` from the root directory.

## Nx workspace script alias
In addition to the above `pnpm nx <command>` format to execute commands, the workspace package contains useful alias for common tasks.

Executing `pnpm <task>` for common tasks will execute `pnpm nx run-many --target=<task> --output-style=stream --nx-bail`, such as `pnpm build` will execute `pnpx nx run-many --target=build --output-style=stream --nx-bail` across all packages.

All nx run-many alias scripts access additional arguments, such as to only run on specific projects you can use `pnpm build --projects=proj1,proj2`.
> See [Nx Run-Many options](https://nx.dev/packages/nx/documents/run-many#options) for details.

## Documentation

For documentation including examples and a full API reference, visit: [https://aws.github.io/aws-prototyping-sdk/](https://aws.github.io/aws-prototyping-sdk/)

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for more information.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
