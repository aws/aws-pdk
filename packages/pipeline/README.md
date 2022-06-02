The pipeline module vends an extension to CDK's CodePipeline construct, named PDKPipeline. It additionally creates a CodeCommit repository and by default is configured to build the project assumming nx-monorepo is being used (although this can be changed). A Sonarqube Scanner can also be configured to trigger a scan whenever the synth build job completes successfully. This Scanner is non-blocking and as such is not instrumented as part of the pipeline.

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
npx projen new --from aws-prototyping-sdk pdk-pipeline-ts
```

```bash
# Python
npx projen new --from aws-prototyping-sdk pdk-pipeline-py
```

```bash
# Java
npx projen new --from aws-prototyping-sdk pdk-pipeline-java
```