/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsArchProject } from "./projenrc/projects/aws-arch-project";
import { CdkGraphPluginDiagramProject } from "./projenrc/projects/cdk-graph-plugin-diagram-project";
import { CdkGraphProject } from "./projenrc/projects/cdk-graph-project";
import { CloudscapeReactTsWebsiteProject } from "./projenrc/projects/cloudscape-react-ts-website-project";
import { DocsProject } from "./projenrc/projects/docs-project";
import { IdentityProject } from "./projenrc/projects/identity-project";
import { InfrastructureProject } from "./projenrc/projects/infrastructure-project";
import { MonorepoProject } from "./projenrc/projects/monorepo-project";
import { PDKMonorepoProject } from "./projenrc/projects/pdk-monorepo-project";
import { PDKNagProject } from "./projenrc/projects/pdk-nag-project";
import { PdkProject } from "./projenrc/projects/pdk-project";
import { PipelineProject } from "./projenrc/projects/pipeline-project";
import { StaticWebsiteProject } from "./projenrc/projects/static-website-project";
import { TypeSafeApiProject } from "./projenrc/projects/type-safe-api-project";

// root/parent project
const monorepoProject = new PDKMonorepoProject();

new PDKNagProject(monorepoProject);

// public packages
new MonorepoProject(monorepoProject);
new StaticWebsiteProject(monorepoProject);
new IdentityProject(monorepoProject);
new TypeSafeApiProject(monorepoProject);
new CloudscapeReactTsWebsiteProject(monorepoProject);
new AwsArchProject(monorepoProject);
new CdkGraphProject(monorepoProject);
new CdkGraphPluginDiagramProject(monorepoProject);
new PipelineProject(monorepoProject);
new InfrastructureProject(monorepoProject);

// This must always appear after all other packages!
new PdkProject(monorepoProject);

// docs
new DocsProject(monorepoProject);

monorepoProject.synth();
