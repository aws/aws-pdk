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
import { AwsPrototypingSdkProject } from "./private/projects/aws-prototyping-sdk-project";
import { PublicProject } from "./private/projects/public-project";
import { IdentityProject } from "./private/projects/identity-project";
import { NXMonorepoProject } from "./private/projects/nx-monorepo-project";
import { PDKMonorepoProject } from "./private/projects/pdk-monorepo-project";
import { PipelineProject } from "./private/projects/pipeline-project";
import { StaticWebsiteProject } from "./private/projects/static-website-project";
import { OpenApiGatewayProject } from "./private/projects/open-api-gateway-project";

// root/parent project
const monorepoProject = new PDKMonorepoProject();

// docs
new PublicProject(monorepoProject);

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
