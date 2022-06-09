# aws-prototyping-sdk

AWS Prototyping SDK (PDK) is a package which contains useful CDK and Projen constructs.

## Getting Started

Ensure you have the following packages installed globally:

* [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
* [node > 14](https://nodejs.org/en/download/package-manager/) (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install)
* [Python >= 3.7](https://www.python.org/downloads/)
* [Java >= 8](https://aws.amazon.com/fr/corretto/) and [Maven >= 3.6](https://maven.apache.org/download.cgi)

```bash
# from root directory of this package
yarn
```

## Usage of projen/nx

This package is built using [projen](https://github.com/projen/projen) and [nx](https://nx.dev/getting-started/intro) as such all tasks should be invoked
via either:

- `npx nx run-many --target=<task> --all` - executes the `<task>` on every package, in dependency order.
- `npx nx run <package_name>:<task>` - executes the `<task>` on the specified `<package_name>`. 

To build the full project, run `npx nx run-many --target=build --all`

Any change to `projects/*` or `.projenrc.ts` requires a synth to be executed. To do this, run: `npx projen` from the root directory.

## Documentation

For documentation including examples and a full API reference, visit: [https://aws.github.io/aws-prototyping-sdk/](https://aws.github.io/aws-prototyping-sdk/)

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for more information.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
