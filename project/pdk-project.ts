import { TypeScriptProject } from "projen/lib/typescript";
import { Project } from 'projen';

export class PDKProject extends TypeScriptProject {
    constructor(parent: Project) {
        super({
            parent,
            outdir: "internal/pdk-project",
            defaultReleaseBranch: "mainline",
            name: "@aws-prototyping-sdk/pdk-project",
            sampleCode: false,
            devDeps: [
              "projen",
            ],
            peerDeps: ["projen"]
          });

        this.package.addField("private", true);
    }
}