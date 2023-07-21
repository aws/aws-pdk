# How to contribute

## Contributing guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional documentation, we greatly value feedback and contributions from our community.

Read through this document before submitting any issues or pull requests to ensure we have all the necessary information to effectively respond to your bug report or contribution.

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, ensure that:

1. You are working against the latest source on the _mainline_ branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Run `pnpm build` to ensure everything builds and tests correctly.
   > This will run `pnpm nx run-many --target=build --output-style=stream --nx-bail` to build all sub-projects in the workspace.
4. Commit to your fork on a new branch using [conventional commit messages](#commits).
5. Send us a pull request, answering any default questions in the pull request template.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Using conventional commits

This package uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and we recommend adopting this across all commit messages. A `commit-msg` hook is installed as part of this package to enforce correct commit message structure and will be run every tim, you run a `git commit ...` command.

[Commitizen](https://github.com/commitizen/cz-cli) has been installed for your convenience which provides a guided UI for committing changes. To commit your changes run the following commands:

```bash
git add -A # stage your changes
pnpm cz # launch commitizen
```

An interactive UI is displayed, which you can use to commit your change.

Package versioning is determined based on the semantic commit and it is important you follow this format. A PR checker will also run to ensure the format of your commit message is compliant.

!!! warning

    Breaking changes should only apply to `stable` packages (those bundled in `aws-prototyping-sdk`). While `experimental` packages may have 'breaking changes', we should not treat them as such from a `semVer` perspective and instead just increment the minor version.

## Release schedule

The PDK has a full-cd release pipeline. Assuming all tests and CI workflows succeed, you can expect a new release to be published to all package managers within 30 minutes of a PR being merged.

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. By default, our projects use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.