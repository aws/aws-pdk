import { PDKProject } from "../private/pdk-project";
import { Project } from "projen";
import { Stability } from 'projen/lib/cdk';

/**
 * Contains configuration for the StaticWebsiteProject.
 */
export class StaticWebsiteProject extends PDKProject {
    constructor(parent: Project) {
        super({
            parent,
            author: "AWS APJ COPE",
            authorAddress: "apj-cope@amazon.com",
            defaultReleaseBranch: "mainline",
            name: "static-website",
            keywords: ["aws", "pdk", "jsii", "projen"],
            repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
            devDeps: ["projen"],
            deps: [
              "projen",
              "aws-cdk-lib",
              "aws-sdk",
              "constructs",
              "@aws-cdk/aws-cognito-identitypool-alpha"
            ],
            peerDeps: [
              "projen",
              "aws-cdk-lib",
              "constructs",
              "@aws-cdk/aws-cognito-identitypool-alpha"
            ],
            bundledDeps: ["aws-sdk"],
            stability: Stability.EXPERIMENTAL,
          });

        this.addPackageIgnore("**/node_modules");
    }
}