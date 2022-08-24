import { CloudscapeReactTsWebsiteProject } from "@aws-prototyping-sdk/cloudscape-react-ts-website";
import {
  ClientLanguage,
  DocumentationFormat,
  OpenApiGatewayTsProject,
} from "@aws-prototyping-sdk/open-api-gateway";
import { nx_monorepo } from "aws-prototyping-sdk";
import { PDKPipelineTsProject } from "aws-prototyping-sdk/pipeline";

const monorepo = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: [
    "aws-prototyping-sdk",
    "@aws-prototyping-sdk/static-website",
    "@aws-prototyping-sdk/open-api-gateway",
    "@aws-prototyping-sdk/identity",
    "@aws-prototyping-sdk/cloudscape-react-ts-website",
  ],
  name: "PrototypingShow",
});

const api = new OpenApiGatewayTsProject({
  name: "api",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/api",
  clientLanguages: [ClientLanguage.TYPESCRIPT],
  documentationFormats: [DocumentationFormat.HTML2],
});

const website = new CloudscapeReactTsWebsiteProject({
  name: "website",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/website",
  deps: [api.generatedTypescriptClient.package.packageName],
});

new PDKPipelineTsProject({
  name: "infra",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/infra",
  cdkVersion: "2.1.0",
  deps: [
    "@aws-prototyping-sdk/static-website",
    "@aws-prototyping-sdk/open-api-gateway",
    "@aws-prototyping-sdk/identity",
    "@aws-cdk/aws-cognito-identitypool-alpha",
    api.package.packageName,
    website.package.packageName,
  ],
});

monorepo.synth();
