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
      devDeps: [
        "@aws-prototyping-sdk/nx-monorepo@0.0.0",
        "projen",
        "verdaccio",
        "verdaccio-auth-memory",
        "verdaccio-memory",
      ],
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

    // Run integration tests after packaging, since they depend on the packaged artifact
    const integrationTestTask = this.addTask('test:integration', {
      exec: 'jest test-integration --testMatch "**/*.test.ts"',
    });

    this.packageTask.spawn(integrationTestTask);

    this.addPackageIgnore("**/node_modules");
  }
}
