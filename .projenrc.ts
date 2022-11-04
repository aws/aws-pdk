/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
import { PDKProject } from "./private/pdk-project";
import { AwsPrototypingSdkProject } from "./private/projects/aws-prototyping-sdk-project";
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
