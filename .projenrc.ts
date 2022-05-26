import { PDKMonorepoProject } from "./project/pdk-monorepo-project";
import { PDKProject } from "./project/pdk-project";
import { DocsProject } from "./project/docs-project";
import { BuildToolsProject } from "./project/build-tools-project";
import { PipelineProject } from "./project/pipeline-project";
import { NXMonorepoProject } from "./project/nx-monorepo-project";
import { AwsPrototypingSdkProject } from "./project/aws-prototyping-sdk-project";

// root/parent project
const monorepoProject = new PDKMonorepoProject();

// internal
new PDKProject(monorepoProject);
const buildToolsProject = new BuildToolsProject(monorepoProject);
const docsProject = new DocsProject(monorepoProject);

// public packages
new NXMonorepoProject(monorepoProject);
const pipelineProject = new PipelineProject(monorepoProject);
const awsPrototypingSdkProject = new AwsPrototypingSdkProject(monorepoProject);

// implicit dependencies
pipelineProject.samples.forEach(sample => monorepoProject.addImplicitDependency(sample, awsPrototypingSdkProject));
monorepoProject.addImplicitDependency(docsProject, awsPrototypingSdkProject);
monorepoProject.addImplicitDependency(docsProject, buildToolsProject);

monorepoProject.synth();
