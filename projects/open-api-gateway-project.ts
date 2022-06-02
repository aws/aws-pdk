import { Project } from "projen";
import { Stability } from 'projen/lib/cdk';
import {PDKProject} from "../private/pdk-project";

/**
 * Contains configuration for the OpenApiGateway project.
 */
export class OpenApiGatewayProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: 'open-api-gateway',
      keywords: ["aws", "pdk", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen"],
      deps: [
        "projen",
        "aws-cdk-lib",
        "constructs",
        "fs-extra",
      ],
      bundledDeps: [
        "openapi-types",
        "fs-extra",
      ],
      peerDeps: [
        "projen",
        "aws-cdk-lib",
        "constructs"
      ],
      stability: Stability.EXPERIMENTAL,
    });

    this.addPackageIgnore("**/node_modules");
  }
}
