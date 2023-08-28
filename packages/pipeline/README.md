> **BREAKING CHANGES** (pre-release)
>
> - `> v0.16.1`: Refactored PDKPipeline to now be a construct so accessing CodePipeline methods now requires accessing a public codePipeline property i.e: `pdkPipeline.codePipeline.XXX`

The pipeline module vends an extension to CDK's CodePipeline construct, named PDKPipeline. It additionally creates a CodeCommit repository and by default is configured to build the project assumming monorepo is being used (although this can be changed). A Sonarqube Scanner can also be configured to trigger a scan whenever the synth build job completes successfully. This Scanner is non-blocking and as such is not instrumented as part of the pipeline.

The architecture for the PDKPipeline is as follows:

```
CodeCommit repository -> CodePipeline
                             |-> EventBridge Rule (On Build Succeded) -> CodeBuild (Sonar Scan)
                             |-> Secret (sonarqube token)
```

This module additionally vends multiple Projen Projects, one for each of the supported languages. These projects aim to bootstrap your project by providing sample code which uses the PDKPipeline construct.

For example, in .projenrc.ts:

```ts
new PDKPipelineTsProject({
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "mainline",
  devDeps: ["aws-prototyping-sdk"],
  name: "my-pipeline",
});
```

This will generate a package in typescript containing CDK boilerplate for a pipeline stack (which instantiates PDKPipeline), sets up a Dev stage with an Application Stage containing an empty ApplicationStack (to be implemented). Once this package is synthesized, you can run `npx projen` and projen will synthesize your cloudformation.

Alternatively, you can initialize a project using the cli (in an empty directory) for each of the supported languages as follows:

```bash
# Typescript
npx projen new --from @aws-prototyping-sdk/pdk-pipeline-ts
```

```bash
# Python
npx projen new --from @aws-prototyping-sdk/pdk-pipeline-py
```

```bash
# Java
npx projen new --from @aws-prototyping-sdk/pdk-pipeline-java
```

### CDK Nag

In order to keep CDK Nag happy, make sure you build the pipeline before synth as per https://github.com/aws/aws-cdk/issues/18440.

## Multi-branch pipeline management

If your team follows [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow), the pipelines module can optionally help you create independent environments to test and validate changes before merging. When you create a new branch, it will automatically create a new pipeline stack and any stages you configure. Once you have finished testing and delete the branch, it will automatically clean up the stacks created in the branch's environment.

The feature is enabled and configured by setting the `branchNamePrefixes` property of the `PDKPipeline` construct. Any branches created matching this list of prefixes will create a new pipeline and stack.

When your PDKPipeline is run, the current branch will be available in the `BRANCH` environment variable. You can use this to give unique names to the stacks and stages created by that branch. You can also enable and disable stages based on the branch name. For example, you may want the PipelineStack and Dev stage to get created for any branch and only create the Prod stage in the default branch.

### PDKPipeline configuration

#### Example: All Branches

pipeline-stack.ts

```ts
this.pipeline = new PDKPipeline(this, "ApplicationPipeline", {
  primarySynthDirectory: "packages/backend/cdk.out",
  repositoryName: this.node.tryGetContext("repositoryName") || "monorepo",
  branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
});
```

#### Example: Branches starting with "feature/" or "fix/"

pipeline-stack.ts

```ts
this.pipeline = new PDKPipeline(this, "ApplicationPipeline", {
  primarySynthDirectory: "packages/backend/cdk.out",
  repositoryName: this.node.tryGetContext("repositoryName") || "monorepo",
  branchNamePrefixes: ["feature/", "fix/"],
});
```

### Pipeline Definition

When you define your pipeline, you define which stages get created for a given branch and how to name your stacks uniquely. `PipelineStack` must be included.

pipeline.ts

```ts
const branchPrefix = PDKPipeline.getBranchPrefix({ node: app.node });

const pipelineStack = new PipelineStack(app, branchPrefix + "PipelineStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: process.env.CDK_DEFAULT_REGION!,
  },
});

const devStage = new ApplicationStage(app, branchPrefix + "Dev", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!, // Replace with Dev account
    region: process.env.CDK_DEFAULT_REGION!, // Replace with Dev region
  },
});

pipelineStack.pipeline.addStage(devStage);

// Only create the Prod stage in the default branch
if (PDKPipeline.isDefaultBranch({ node: app.node })) {
  const prodStage = new ApplicationStage(app, "Prod", {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT!, // Replace with Prod account
      region: process.env.CDK_DEFAULT_REGION!, // Replace with Prod region
    },
  });

  pipelineStack.pipeline.addStage(prodStage);
}
```
