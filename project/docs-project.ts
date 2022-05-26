import { TypeScriptProject } from "projen/lib/typescript";
import { Project } from 'projen';

export class DocsProject extends TypeScriptProject {
    constructor(parent: Project) {
        super({
          parent,
          outdir: "internal/docs",
          defaultReleaseBranch: "mainline",
          sampleCode: false,
          jest: false,
          name: "docs",
          devDeps: [
            "@types/fs-extra", "exponential-backoff", "jsii-docgen"
          ],
          deps: ["fs-extra"]
        });

        this.package.addField("private", true);
        this.compileTask.reset();
        this.testTask.reset();
        this.packageTask.reset("./scripts/build-docs");
    }
}