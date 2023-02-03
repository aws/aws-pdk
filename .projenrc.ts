/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKProject } from "./private/pdk-project";
import { AwsArchProject } from "./private/projects/aws-arch";
import { AwsPrototypingSdkProject } from "./private/projects/aws-prototyping-sdk-project";
import { CdkGraphProject } from "./private/projects/cdk-graph";
import { CdkGraphPluginDiagramProject } from "./private/projects/cdk-graph-plugin-diagram";
import { CloudscapeReactTsWebsiteProject } from "./private/projects/cloudscape-react-ts-website";
import { DocsProject } from "./private/projects/docs-project";
import { IdentityProject } from "./private/projects/identity-project";
import { NXMonorepoProject } from "./private/projects/nx-monorepo-project";
import { OpenApiGatewayProject } from "./private/projects/open-api-gateway-project";
import { PDKMonorepoProject } from "./private/projects/pdk-monorepo-project";
import { PDKNagProject } from "./private/projects/pdk-nag-project";
import { PipelineProject } from "./private/projects/pipeline-project";
import { StaticWebsiteProject } from "./private/projects/static-website-project";

// root/parent project
const monorepoProject = new PDKMonorepoProject();

// docs
const docsProject = new DocsProject(monorepoProject);

const pdkNagProject = new PDKNagProject(monorepoProject);

// public packages
const nxMonorepoProject = new NXMonorepoProject(monorepoProject);
const pipelineProject = new PipelineProject(monorepoProject);
const awsPrototypingSdkProject = new AwsPrototypingSdkProject(monorepoProject);
new StaticWebsiteProject(monorepoProject);
new IdentityProject(monorepoProject);
new OpenApiGatewayProject(monorepoProject);
new CloudscapeReactTsWebsiteProject(monorepoProject);
new AwsArchProject(monorepoProject);
new CdkGraphProject(monorepoProject);
new CdkGraphPluginDiagramProject(monorepoProject);

// implicit dependencies
pipelineProject.samples.forEach((sample) =>
  monorepoProject.addImplicitDependency(sample, awsPrototypingSdkProject)
);

// Docs should have a dependency on all publishable packages
docsProject.package.addField("nx", {
  implicitDependencies: monorepoProject.subProjects
    .filter((s: any) => s instanceof PDKProject && s.pdkRelease)
    .map((s) => (s as PDKProject).package.packageName),
});

monorepoProject.addImplicitDependency(awsPrototypingSdkProject, pdkNagProject);
monorepoProject.addImplicitDependency(
  awsPrototypingSdkProject,
  pipelineProject
);
monorepoProject.addImplicitDependency(
  awsPrototypingSdkProject,
  nxMonorepoProject
);

monorepoProject.synth();
