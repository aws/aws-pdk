import { TypeScriptProject } from "projen/lib/typescript";
import { Project } from 'projen';

export class BuildToolsProject extends TypeScriptProject {
    constructor(parent: Project) {
        super({
          parent,
          outdir: "internal/build-tools",
          defaultReleaseBranch: "mainline",
          name: "@aws-prototyping-sdk/build-tools",
          sampleCode: false,
          bin: {
            "ubergen": "bin/ubergen",
          },
          gitignore: ["*.d.ts", "*.js"],
          devDeps: ["@types/fs-extra"],
          deps: ["fs-extra"],
          tsconfig: {
            compilerOptions: {
              outDir: "bin",
            }
          }
        });

        this.package.addField("private", true);
        this.postCompileTask.exec("npm link");
    }
}