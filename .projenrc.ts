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
import { AwsPrototypingSdkProject } from "./projects/aws-prototyping-sdk-project";
import { DocsProject } from "./projects/docs-project";
import { IdentityProject } from "./projects/identity-project";
import { NXMonorepoProject } from "./projects/nx-monorepo-project";
import { OpenApiGatewayProject } from "./projects/open-api-gateway-project";
import { PDKMonorepoProject } from "./projects/pdk-monorepo-project";
import { PipelineProject } from "./projects/pipeline-project";
import { StaticWebsiteProject } from "./projects/static-website-project";

// root/parent project
const monorepoProject = new PDKMonorepoProject();

// docs
new DocsProject(monorepoProject);

// public packages
new NXMonorepoProject(monorepoProject);
const pipelineProject = new PipelineProject(monorepoProject);
const awsPrototypingSdkProject = new AwsPrototypingSdkProject(monorepoProject);
new StaticWebsiteProject(monorepoProject);
new IdentityProject(monorepoProject);
new OpenApiGatewayProject(monorepoProject);

// implicit dependencies
pipelineProject.samples.forEach((sample) =>
  monorepoProject.addImplicitDependency(sample, awsPrototypingSdkProject)
);

monorepoProject.synth();
