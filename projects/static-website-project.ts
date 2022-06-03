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
            devDeps: [
              "projen",
              "aws-sdk"
            ],
            deps: [
              "projen",
              "aws-cdk-lib",
              "constructs"
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