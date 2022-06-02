import { PDKMonorepoProject } from "./projects/pdk-monorepo-project";
import { DocsProject } from "./projects/docs-project";
import { PipelineProject } from "./projects/pipeline-project";
import { NXMonorepoProject } from "./projects/nx-monorepo-project";
import { AwsPrototypingSdkProject } from "./projects/aws-prototyping-sdk-project";
import { StaticWebsiteProject } from "./projects/static-website-project";
import { IdentityProject } from "./projects/identity-project";

// root/parent project
const monorepoProject = new PDKMonorepoProject();

// internal
new DocsProject(monorepoProject);

// public packages
new NXMonorepoProject(monorepoProject);
const pipelineProject = new PipelineProject(monorepoProject);
const awsPrototypingSdkProject = new AwsPrototypingSdkProject(monorepoProject);
new StaticWebsiteProject(monorepoProject);
new IdentityProject(monorepoProject);

// implicit dependencies
pipelineProject.samples.forEach(sample => monorepoProject.addImplicitDependency(sample, awsPrototypingSdkProject));

monorepoProject.synth();
