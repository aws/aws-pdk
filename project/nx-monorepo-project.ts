import { Project } from 'projen';
import { Maturity, PDKProject } from "../internal/pdk-project/src";

export class NXMonorepoProject extends PDKProject {
    constructor(parent: Project) {
        super({
          parent,
          author: "AWS APJ COPE",
          authorAddress: "apj-cope@amazon.com",
          defaultReleaseBranch: "mainline",
          name: "nx-monorepo",
          keywords: ["aws", "pdk", "jsii", "projen"],
          repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
          devDeps: ["projen"],
          peerDeps: ["projen"],
          bundledDeps: ["@nrwl/devkit"],
          maturity: Maturity.STABLE
        });

        this.compileTask.exec("rsync -a ./src/** ./lib --include=\"*/\" --include=\"**/*.js\" --exclude=\"*\" --prune-empty-dirs");
    }
}