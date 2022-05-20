"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.NxMonorepoProject = exports.TargetDependencyProject = void 0;
const fs = require("fs");
const path = require("path");
const projen_1 = require("projen");
const typescript_1 = require("projen/lib/typescript");
const NX_MONOREPO_PLUGIN_PATH = ".nx/plugins/nx-monorepo-plugin.js";
/**
 * Supported enums for a TargetDependency.
 */
var TargetDependencyProject;
(function (TargetDependencyProject) {
    /**
     * Only rely on the package where the target is called.
     *
     * This is usually done for test like targets where you only want to run unit
     * tests on the target packages without testing all dependent packages.
     */
    TargetDependencyProject["SELF"] = "self";
    /**
     * Target relies on executing the target against all dependencies first.
     *
     * This is usually done for build like targets where you want to build all
     * dependant projects first.
     */
    TargetDependencyProject["DEPENDENCIES"] = "dependencies";
})(TargetDependencyProject = exports.TargetDependencyProject || (exports.TargetDependencyProject = {}));
/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid nx-monorepo
 */
class NxMonorepoProject extends typescript_1.TypeScriptProject {
    constructor(options) {
        super({
            ...options,
            github: false,
            jest: false,
            package: false,
            prettier: true,
            projenrcTs: true,
            release: false,
            sampleCode: false,
            defaultReleaseBranch: "mainline",
        });
        this.implicitDependencies = {};
        this.noHoistGlobs = [];
        this.noHoistGlobs = options.noHoistGlobs;
        // Never publish a monorepo root package.
        this.package.addField("private", true);
        // No need to compile or test a monorepo root package.
        this.compileTask.reset();
        this.testTask.reset();
        this.addDevDeps("@nrwl/cli", "@nrwl/workspace");
        new projen_1.IgnoreFile(this, ".nxignore").exclude("test-reports", "target", ".env", ".pytest_cache", ...(options.nxIgnorePatterns || []));
        new projen_1.TextFile(this, NX_MONOREPO_PLUGIN_PATH, {
            readonly: true,
            lines: fs.readFileSync(getPluginPath()).toString("utf-8").split("\n"),
        });
        new projen_1.JsonFile(this, "nx.json", {
            obj: {
                extends: "@nrwl/workspace/presets/npm.json",
                plugins: [`./${NX_MONOREPO_PLUGIN_PATH}`],
                npmScope: "monorepo",
                tasksRunnerOptions: {
                    default: {
                        runner: "@nrwl/workspace/tasks-runners/default",
                        options: {
                            useDaemonProcess: false,
                            cacheableOperations: ["build", "test"],
                        },
                    },
                },
                implicitDependencies: this.implicitDependencies,
                targetDependencies: {
                    build: [
                        {
                            target: "build",
                            projects: "dependencies",
                        },
                    ],
                    ...(options.targetDependencies || {}),
                },
                affected: {
                    defaultBase: "mainline",
                },
            },
        });
    }
    /**
     * Create an implicit dependency between two Project's. This is typically
     * used in polygot repos where a Typescript project wants a build dependency
     * on a Python project as an example.
     *
     * @param dependent project you want to have the dependency.
     * @param dependee project you wish to depend on.
     */
    addImplicitDependency(dependent, dependee) {
        if (this.implicitDependencies[dependent.name]) {
            this.implicitDependencies[dependent.name].push(dependee.name);
        }
        else {
            this.implicitDependencies[dependent.name] = [dependee.name];
        }
    }
    // Remove this hack once subProjects is made public in Projen
    get subProjects() {
        // @ts-ignore
        const subProjects = this.subprojects || [];
        return subProjects.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * @inheritDoc
     */
    preSynthesize() {
        super.preSynthesize();
        // Add workspaces for each subproject
        this.package.addField("workspaces", {
            packages: this.subProjects.map((subProject) => path.relative(this.outdir, subProject.outdir)),
            nohoist: this.noHoistGlobs,
        });
        // Disable default task on subprojects as this isn't supported in a monorepo
        this.subProjects.forEach((subProject) => { var _a; return (_a = subProject.defaultTask) === null || _a === void 0 ? void 0 : _a.reset(); });
    }
    /**
     * @inheritDoc
     */
    synth() {
        // Check to see if a new subProject was added
        const newSubProject = this.subProjects.find((subProject) => !fs.existsSync(subProject.outdir));
        // Need to synth before generating the package.json otherwise the subdirectory won't exist
        newSubProject && super.synth();
        this.subProjects
            .filter((subProject) => !subProject.tryFindObjectFile("package.json") ||
            (fs.existsSync(`${subProject.outdir}/package.json`) &&
                JSON.parse(fs.readFileSync(`${subProject.outdir}/package.json`).toString()).__pdk__))
            .forEach((subProject) => {
            // generate a package.json if not found
            const manifest = {};
            manifest.name = subProject.name;
            manifest.private = true;
            manifest.__pdk__ = true;
            manifest.scripts = subProject.tasks.all.reduce((p, c) => ({
                [c.name]: `npx projen ${c.name}`,
                ...p,
            }), {});
            manifest.version = "0.0.0";
            new projen_1.JsonFile(subProject, "package.json", {
                obj: manifest,
                readonly: true,
            });
        });
        super.synth();
    }
}
exports.NxMonorepoProject = NxMonorepoProject;
function getPluginPath() {
    return path.join(__dirname, "plugin/nx-monorepo-plugin.js");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibngtbW9ub3JlcG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJueC1tb25vcmVwby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUVBQXFFO0FBQ3JFLHNDQUFzQzs7O0FBRXRDLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQWlFO0FBQ2pFLHNEQUcrQjtBQUUvQixNQUFNLHVCQUF1QixHQUFXLG1DQUFtQyxDQUFDO0FBRTVFOztHQUVHO0FBQ0gsSUFBWSx1QkFlWDtBQWZELFdBQVksdUJBQXVCO0lBQ2pDOzs7OztPQUtHO0lBQ0gsd0NBQWEsQ0FBQTtJQUNiOzs7OztPQUtHO0lBQ0gsd0RBQTZCLENBQUE7QUFDL0IsQ0FBQyxFQWZXLHVCQUF1QixHQUF2QiwrQkFBdUIsS0FBdkIsK0JBQXVCLFFBZWxDO0FBbUREOzs7OztHQUtHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSw4QkFBaUI7SUFJdEQsWUFBWSxPQUFpQztRQUMzQyxLQUFLLENBQUM7WUFDSixHQUFHLE9BQU87WUFDVixNQUFNLEVBQUUsS0FBSztZQUNiLElBQUksRUFBRSxLQUFLO1lBQ1gsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsSUFBSTtZQUNkLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsVUFBVSxFQUFFLEtBQUs7WUFDakIsb0JBQW9CLEVBQUUsVUFBVTtTQUNqQyxDQUFDLENBQUM7UUFkWSx5QkFBb0IsR0FBZ0MsRUFBRSxDQUFDO1FBQ3ZELGlCQUFZLEdBQWMsRUFBRSxDQUFDO1FBZTVDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUV6Qyx5Q0FBeUM7UUFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXZDLHNEQUFzRDtRQUN0RCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxR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QUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNULENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDaEMsR0FBRyxDQUFDO2FBQ0wsQ0FBQyxFQUNGLEVBQUUsQ0FDSCxDQUFDO1lBQ0YsUUFBUSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFFM0IsSUFBSSxpQkFBUSxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUU7Z0JBQ3ZDLEdBQUcsRUFBRSxRQUFRO2dCQUNiLFFBQVEsRUFBRSxJQUFJO2FBQ2YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFTCxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDaEIsQ0FBQztDQUNGO0FBN0pELDhDQTZKQztBQUVELFNBQVMsYUFBYTtJQUNwQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDhCQUE4QixDQUFDLENBQUM7QUFDOUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjBcblxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBJZ25vcmVGaWxlLCBKc29uRmlsZSwgUHJvamVjdCwgVGV4dEZpbGUgfSBmcm9tIFwicHJvamVuXCI7XG5pbXBvcnQge1xuICBUeXBlU2NyaXB0UHJvamVjdCxcbiAgVHlwZVNjcmlwdFByb2plY3RPcHRpb25zLFxufSBmcm9tIFwicHJvamVuL2xpYi90eXBlc2NyaXB0XCI7XG5cbmNvbnN0IE5YX01PTk9SRVBPX1BMVUdJTl9QQVRIOiBzdHJpbmcgPSBcIi5ueC9wbHVnaW5zL254LW1vbm9yZXBvLXBsdWdpbi5qc1wiO1xuXG4vKipcbiAqIFN1cHBvcnRlZCBlbnVtcyBmb3IgYSBUYXJnZXREZXBlbmRlbmN5LlxuICovXG5leHBvcnQgZW51bSBUYXJnZXREZXBlbmRlbmN5UHJvamVjdCB7XG4gIC8qKlxuICAgKiBPbmx5IHJlbHkgb24gdGhlIHBhY2thZ2Ugd2hlcmUgdGhlIHRhcmdldCBpcyBjYWxsZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXN1YWxseSBkb25lIGZvciB0ZXN0IGxpa2UgdGFyZ2V0cyB3aGVyZSB5b3Ugb25seSB3YW50IHRvIHJ1biB1bml0XG4gICAqIHRlc3RzIG9uIHRoZSB0YXJnZXQgcGFja2FnZXMgd2l0aG91dCB0ZXN0aW5nIGFsbCBkZXBlbmRlbnQgcGFja2FnZXMuXG4gICAqL1xuICBTRUxGID0gXCJzZWxmXCIsXG4gIC8qKlxuICAgKiBUYXJnZXQgcmVsaWVzIG9uIGV4ZWN1dGluZyB0aGUgdGFyZ2V0IGFnYWluc3QgYWxsIGRlcGVuZGVuY2llcyBmaXJzdC5cbiAgICpcbiAgICogVGhpcyBpcyB1c3VhbGx5IGRvbmUgZm9yIGJ1aWxkIGxpa2UgdGFyZ2V0cyB3aGVyZSB5b3Ugd2FudCB0byBidWlsZCBhbGxcbiAgICogZGVwZW5kYW50IHByb2plY3RzIGZpcnN0LlxuICAgKi9cbiAgREVQRU5ERU5DSUVTID0gXCJkZXBlbmRlbmNpZXNcIixcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIE5YIFRhcmdldCBEZXBlbmRlbmN5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRhcmdldERlcGVuZGVuY3kge1xuICAvKipcbiAgICogUHJvamVuIHRhcmdldCBpLmU6IGJ1aWxkLCB0ZXN0LCBldGNcbiAgICovXG4gIHJlYWRvbmx5IHRhcmdldDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUYXJnZXQgZGVwZW5kZW5jaWVzLlxuICAgKi9cbiAgcmVhZG9ubHkgcHJvamVjdHM6IFRhcmdldERlcGVuZGVuY3lQcm9qZWN0O1xufVxuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gZm9yIG54IHRhcmdldERlcGVuZGVuY2llcy5cbiAqL1xuZXhwb3J0IHR5cGUgVGFyZ2V0RGVwZW5kZW5jaWVzID0geyBbdGFyZ2V0OiBzdHJpbmddOiBUYXJnZXREZXBlbmRlbmN5W10gfTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBOeE1vbm9yZXBvUHJvamVjdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOeE1vbm9yZXBvUHJvamVjdE9wdGlvbnMgZXh0ZW5kcyBUeXBlU2NyaXB0UHJvamVjdE9wdGlvbnMge1xuICAvKipcbiAgICogQ29uZmlndXJhdGlvbiBmb3IgTlggVGFyZ2V0RGVwZW5kZW5jaWVzLlxuICAgKlxuICAgKiBAbGluayBodHRwczovL254LmRldi9jb25maWd1cmF0aW9uL3BhY2thZ2Vqc29uI3RhcmdldC1kZXBlbmRlbmNpZXNcbiAgICogQGRlZmF1bHQge31cbiAgICovXG4gIHJlYWRvbmx5IHRhcmdldERlcGVuZGVuY2llcz86IFRhcmdldERlcGVuZGVuY2llcztcblxuICAvKipcbiAgICogTGlzdCBvZiBwYXR0ZXJucyB0byBpbmNsdWRlIGluIHRoZSAubnhpZ25vcmUgZmlsZS5cbiAgICpcbiAgICogQGxpbmsgaHR0cHM6Ly9ueC5kZXYvY29uZmlndXJhdGlvbi9wYWNrYWdlanNvbiNueGlnbm9yZVxuICAgKiBAZGVmYXVsdCBbXVxuICAgKi9cbiAgcmVhZG9ubHkgbnhJZ25vcmVQYXR0ZXJucz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIHBhY2thZ2UgZ2xvYnMgdG8gZXhjbHVkZSBmcm9tIGhvaXN0aW5nIGluIHRoZSB3b3Jrc3BhY2UuXG4gICAqXG4gICAqIEBsaW5rIGh0dHBzOi8vY2xhc3NpYy55YXJucGtnLmNvbS9ibG9nLzIwMTgvMDIvMTUvbm9ob2lzdC9cbiAgICogQGRlZmF1bHQgW11cbiAgICovXG4gIHJlYWRvbmx5IG5vSG9pc3RHbG9icz86IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFRoaXMgcHJvamVjdCB0eXBlIHdpbGwgYm9vdHN0cmFwIGEgTlggYmFzZWQgbW9ub3JlcG8gd2l0aCBzdXBwb3J0IGZvciBwb2x5Z290XG4gKiBidWlsZHMsIGJ1aWxkIGNhY2hpbmcsIGRlcGVuZGVuY3kgZ3JhcGggdmlzdWFsaXphdGlvbiBhbmQgbXVjaCBtb3JlLlxuICpcbiAqIEBwamlkIG54LW1vbm9yZXBvXG4gKi9cbmV4cG9ydCBjbGFzcyBOeE1vbm9yZXBvUHJvamVjdCBleHRlbmRzIFR5cGVTY3JpcHRQcm9qZWN0IHtcbiAgcHJpdmF0ZSByZWFkb25seSBpbXBsaWNpdERlcGVuZGVuY2llczogeyBbcGtnOiBzdHJpbmddOiBzdHJpbmdbXSB9ID0ge307XG4gIHByaXZhdGUgcmVhZG9ubHkgbm9Ib2lzdEdsb2JzPzogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBOeE1vbm9yZXBvUHJvamVjdE9wdGlvbnMpIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgZ2l0aHViOiBmYWxzZSxcbiAgICAgIGplc3Q6IGZhbHNlLFxuICAgICAgcGFja2FnZTogZmFsc2UsXG4gICAgICBwcmV0dGllcjogdHJ1ZSxcbiAgICAgIHByb2plbnJjVHM6IHRydWUsXG4gICAgICByZWxlYXNlOiBmYWxzZSxcbiAgICAgIHNhbXBsZUNvZGU6IGZhbHNlLFxuICAgICAgZGVmYXVsdFJlbGVhc2VCcmFuY2g6IFwibWFpbmxpbmVcIixcbiAgICB9KTtcblxuICAgIHRoaXMubm9Ib2lzdEdsb2JzID0gb3B0aW9ucy5ub0hvaXN0R2xvYnM7XG5cbiAgICAvLyBOZXZlciBwdWJsaXNoIGEgbW9ub3JlcG8gcm9vdCBwYWNrYWdlLlxuICAgIHRoaXMucGFja2FnZS5hZGRGaWVsZChcInByaXZhdGVcIiwgdHJ1ZSk7XG5cbiAgICAvLyBObyBuZWVkIHRvIGNvbXBpbGUgb3IgdGVzdCBhIG1vbm9yZXBvIHJvb3QgcGFja2FnZS5cbiAgICB0aGlzLmNvbXBpbGVUYXNrLnJlc2V0KCk7XG4gICAgdGhpcy50ZXN0VGFzay5yZXNldCgpO1xuXG4gICAgdGhpcy5hZGREZXZEZXBzKFwiQG5yd2wvY2xpXCIsIFwiQG5yd2wvd29ya3NwYWNlXCIpO1xuXG4gICAgbmV3IElnbm9yZUZpbGUodGhpcywgXCIubnhpZ25vcmVcIikuZXhjbHVkZShcbiAgICAgIFwidGVzdC1yZXBvcnRzXCIsXG4gICAgICBcInRhcmdldFwiLFxuICAgICAgXCIuZW52XCIsXG4gICAgICBcIi5weXRlc3RfY2FjaGVcIixcbiAgICAgIC4uLihvcHRpb25zLm54SWdub3JlUGF0dGVybnMgfHwgW10pXG4gICAgKTtcblxuICAgIG5ldyBUZXh0RmlsZSh0aGlzLCBOWF9NT05PUkVQT19QTFVHSU5fUEFUSCwge1xuICAgICAgcmVhZG9ubHk6IHRydWUsXG4gICAgICBsaW5lczogZnMucmVhZEZpbGVTeW5jKGdldFBsdWdpblBhdGgoKSkudG9TdHJpbmcoXCJ1dGYtOFwiKS5zcGxpdChcIlxcblwiKSxcbiAgICB9KTtcblxuICAgIG5ldyBKc29uRmlsZSh0aGlzLCBcIm54Lmpzb25cIiwge1xuICAgICAgb2JqOiB7XG4gICAgICAgIGV4dGVuZHM6IFwiQG5yd2wvd29ya3NwYWNlL3ByZXNldHMvbnBtLmpzb25cIixcbiAgICAgICAgcGx1Z2luczogW2AuLyR7TlhfTU9OT1JFUE9fUExVR0lOX1BBVEh9YF0sXG4gICAgICAgIG5wbVNjb3BlOiBcIm1vbm9yZXBvXCIsXG4gICAgICAgIHRhc2tzUnVubmVyT3B0aW9uczoge1xuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIHJ1bm5lcjogXCJAbnJ3bC93b3Jrc3BhY2UvdGFza3MtcnVubmVycy9kZWZhdWx0XCIsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIHVzZURhZW1vblByb2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICBjYWNoZWFibGVPcGVyYXRpb25zOiBbXCJidWlsZFwiLCBcInRlc3RcIl0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGltcGxpY2l0RGVwZW5kZW5jaWVzOiB0aGlzLmltcGxpY2l0RGVwZW5kZW5jaWVzLFxuICAgICAgICB0YXJnZXREZXBlbmRlbmNpZXM6IHtcbiAgICAgICAgICBidWlsZDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0YXJnZXQ6IFwiYnVpbGRcIixcbiAgICAgICAgICAgICAgcHJvamVjdHM6IFwiZGVwZW5kZW5jaWVzXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLi4uKG9wdGlvbnMudGFyZ2V0RGVwZW5kZW5jaWVzIHx8IHt9KSxcbiAgICAgICAgfSxcbiAgICAgICAgYWZmZWN0ZWQ6IHtcbiAgICAgICAgICBkZWZhdWx0QmFzZTogXCJtYWlubGluZVwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gaW1wbGljaXQgZGVwZW5kZW5jeSBiZXR3ZWVuIHR3byBQcm9qZWN0J3MuIFRoaXMgaXMgdHlwaWNhbGx5XG4gICAqIHVzZWQgaW4gcG9seWdvdCByZXBvcyB3aGVyZSBhIFR5cGVzY3JpcHQgcHJvamVjdCB3YW50cyBhIGJ1aWxkIGRlcGVuZGVuY3lcbiAgICogb24gYSBQeXRob24gcHJvamVjdCBhcyBhbiBleGFtcGxlLlxuICAgKlxuICAgKiBAcGFyYW0gZGVwZW5kZW50IHByb2plY3QgeW91IHdhbnQgdG8gaGF2ZSB0aGUgZGVwZW5kZW5jeS5cbiAgICogQHBhcmFtIGRlcGVuZGVlIHByb2plY3QgeW91IHdpc2ggdG8gZGVwZW5kIG9uLlxuICAgKi9cbiAgcHVibGljIGFkZEltcGxpY2l0RGVwZW5kZW5jeShkZXBlbmRlbnQ6IFByb2plY3QsIGRlcGVuZGVlOiBQcm9qZWN0KSB7XG4gICAgaWYgKHRoaXMuaW1wbGljaXREZXBlbmRlbmNpZXNbZGVwZW5kZW50Lm5hbWVdKSB7XG4gICAgICB0aGlzLmltcGxpY2l0RGVwZW5kZW5jaWVzW2RlcGVuZGVudC5uYW1lXS5wdXNoKGRlcGVuZGVlLm5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmltcGxpY2l0RGVwZW5kZW5jaWVzW2RlcGVuZGVudC5uYW1lXSA9IFtkZXBlbmRlZS5uYW1lXTtcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgdGhpcyBoYWNrIG9uY2Ugc3ViUHJvamVjdHMgaXMgbWFkZSBwdWJsaWMgaW4gUHJvamVuXG4gIHByaXZhdGUgZ2V0IHN1YlByb2plY3RzKCk6IFByb2plY3RbXSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IHN1YlByb2plY3RzOiBQcm9qZWN0W10gPSB0aGlzLnN1YnByb2plY3RzIHx8IFtdO1xuICAgIHJldHVybiBzdWJQcm9qZWN0cy5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdERvY1xuICAgKi9cbiAgcHJlU3ludGhlc2l6ZSgpIHtcbiAgICBzdXBlci5wcmVTeW50aGVzaXplKCk7XG5cbiAgICAvLyBBZGQgd29ya3NwYWNlcyBmb3IgZWFjaCBzdWJwcm9qZWN0XG4gICAgdGhpcy5wYWNrYWdlLmFkZEZpZWxkKFwid29ya3NwYWNlc1wiLCB7XG4gICAgICBwYWNrYWdlczogdGhpcy5zdWJQcm9qZWN0cy5tYXAoKHN1YlByb2plY3QpID0+XG4gICAgICAgIHBhdGgucmVsYXRpdmUodGhpcy5vdXRkaXIsIHN1YlByb2plY3Qub3V0ZGlyKVxuICAgICAgKSxcbiAgICAgIG5vaG9pc3Q6IHRoaXMubm9Ib2lzdEdsb2JzLFxuICAgIH0pO1xuXG4gICAgLy8gRGlzYWJsZSBkZWZhdWx0IHRhc2sgb24gc3VicHJvamVjdHMgYXMgdGhpcyBpc24ndCBzdXBwb3J0ZWQgaW4gYSBtb25vcmVwb1xuICAgIHRoaXMuc3ViUHJvamVjdHMuZm9yRWFjaCgoc3ViUHJvamVjdCkgPT4gc3ViUHJvamVjdC5kZWZhdWx0VGFzaz8ucmVzZXQoKSk7XG4gIH1cblxuICAvKipcbiAgICogQGluaGVyaXREb2NcbiAgICovXG4gIHN5bnRoKCkge1xuICAgIC8vIENoZWNrIHRvIHNlZSBpZiBhIG5ldyBzdWJQcm9qZWN0IHdhcyBhZGRlZFxuICAgIGNvbnN0IG5ld1N1YlByb2plY3QgPSB0aGlzLnN1YlByb2plY3RzLmZpbmQoXG4gICAgICAoc3ViUHJvamVjdCkgPT4gIWZzLmV4aXN0c1N5bmMoc3ViUHJvamVjdC5vdXRkaXIpXG4gICAgKTtcblxuICAgIC8vIE5lZWQgdG8gc3ludGggYmVmb3JlIGdlbmVyYXRpbmcgdGhlIHBhY2thZ2UuanNvbiBvdGhlcndpc2UgdGhlIHN1YmRpcmVjdG9yeSB3b24ndCBleGlzdFxuICAgIG5ld1N1YlByb2plY3QgJiYgc3VwZXIuc3ludGgoKTtcblxuICAgIHRoaXMuc3ViUHJvamVjdHNcbiAgICAgIC5maWx0ZXIoXG4gICAgICAgIChzdWJQcm9qZWN0KSA9PlxuICAgICAgICAgICFzdWJQcm9qZWN0LnRyeUZpbmRPYmplY3RGaWxlKFwicGFja2FnZS5qc29uXCIpIHx8XG4gICAgICAgICAgKGZzLmV4aXN0c1N5bmMoYCR7c3ViUHJvamVjdC5vdXRkaXJ9L3BhY2thZ2UuanNvbmApICYmXG4gICAgICAgICAgICBKU09OLnBhcnNlKFxuICAgICAgICAgICAgICBmcy5yZWFkRmlsZVN5bmMoYCR7c3ViUHJvamVjdC5vdXRkaXJ9L3BhY2thZ2UuanNvbmApLnRvU3RyaW5nKClcbiAgICAgICAgICAgICkuX19wZGtfXylcbiAgICAgIClcbiAgICAgIC5mb3JFYWNoKChzdWJQcm9qZWN0KSA9PiB7XG4gICAgICAgIC8vIGdlbmVyYXRlIGEgcGFja2FnZS5qc29uIGlmIG5vdCBmb3VuZFxuICAgICAgICBjb25zdCBtYW5pZmVzdDogYW55ID0ge307XG4gICAgICAgIG1hbmlmZXN0Lm5hbWUgPSBzdWJQcm9qZWN0Lm5hbWU7XG4gICAgICAgIG1hbmlmZXN0LnByaXZhdGUgPSB0cnVlO1xuICAgICAgICBtYW5pZmVzdC5fX3Bka19fID0gdHJ1ZTtcbiAgICAgICAgbWFuaWZlc3Quc2NyaXB0cyA9IHN1YlByb2plY3QudGFza3MuYWxsLnJlZHVjZShcbiAgICAgICAgICAocCwgYykgPT4gKHtcbiAgICAgICAgICAgIFtjLm5hbWVdOiBgbnB4IHByb2plbiAke2MubmFtZX1gLFxuICAgICAgICAgICAgLi4ucCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB7fVxuICAgICAgICApO1xuICAgICAgICBtYW5pZmVzdC52ZXJzaW9uID0gXCIwLjAuMFwiO1xuXG4gICAgICAgIG5ldyBKc29uRmlsZShzdWJQcm9qZWN0LCBcInBhY2thZ2UuanNvblwiLCB7XG4gICAgICAgICAgb2JqOiBtYW5pZmVzdCxcbiAgICAgICAgICByZWFkb25seTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHN1cGVyLnN5bnRoKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGx1Z2luUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihfX2Rpcm5hbWUsIFwicGx1Z2luL254LW1vbm9yZXBvLXBsdWdpbi5qc1wiKTtcbn1cbiJdfQ==