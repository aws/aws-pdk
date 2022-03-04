# aws-prototyping-sdk

AWS Prototyping SDK (PDK) is a package which contains re-usable L2 and L3 CDK constructs.

## Getting Started

Ensure you have the following packages installed globally:

* [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
* [node > 14](https://nodejs.org/en/download/package-manager/) (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install)

```bash
# from root directory of this package
yarn
```

## Usage of projen

This package is built using [projen](https://github.com/projen/projen) and as such all build tasks should be invoked
via a `npx projen <task>` command.

A list of key tasks are as follows:

* `build` - *compiles (tsc and jsii), tests and packages (into dist).*
* `build:docs` - *generates a micro-site in all supported languages*
* `package-all` - *Generates ready-to-publish language-specific packages for jsii modules (into dist).*
* `clean` - *deletes all generated build artifacts and directories.*
* `test` - *runs jest tests, eslint, git-secrets-scan & license-checker.*

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## Contributing

This package utilizes [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and as such all
commit messages will need to adopt this format. A `commit-msg` hook is installed as part of this package to
enforce correct commit message structure and will be run anytime a `git commit ...` is executed.

[Commitizen](https://github.com/commitizen/cz-cli) has been installed for your convenience which provides a guided UI
for committing changes. To commit your changes run the following commands:

```bash
git add -A # stage your changes
git cz # launch commitizen
```

An interactive UI will be displayed which you can follow to get your change committed.

See [CONTRIBUTING](CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.
