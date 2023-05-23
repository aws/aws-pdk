/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NxProject } from "./packages/nx-monorepo/src/components/nx-project";
import { NxReleaseProject } from "./packages/nx-monorepo/src/components/release";
import { AwsArchProject } from "./private/projects/aws-arch";
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
import { TypeSafeApiProject } from "./private/projects/type-safe-api-project";

// root/parent project
const monorepoProject = new PDKMonorepoProject();

new PDKNagProject(monorepoProject);

// public packages
new NXMonorepoProject(monorepoProject);
new StaticWebsiteProject(monorepoProject);
new IdentityProject(monorepoProject);
new OpenApiGatewayProject(monorepoProject);
new TypeSafeApiProject(monorepoProject);
new CloudscapeReactTsWebsiteProject(monorepoProject);
new AwsArchProject(monorepoProject);
new CdkGraphProject(monorepoProject);
new CdkGraphPluginDiagramProject(monorepoProject);
new PipelineProject(monorepoProject);

// docs
const docsProject = new DocsProject(monorepoProject);
// Docs should have a dependency on all publishable packages
NxProject.ensure(docsProject).addImplicitDependency(
  ...monorepoProject.sortedSubProjects.filter((s: any) =>
    NxReleaseProject.of(s)
  )
);

monorepoProject.synth();
