"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NxMonorepoProject = exports.TargetDependencyProject = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
        this.subProjects.forEach((subProject) => { var _b; return (_b = subProject.defaultTask) === null || _b === void 0 ? void 0 : _b.reset(); });
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
_a = JSII_RTTI_SYMBOL_1;
NxMonorepoProject[_a] = { fqn: "@aws/aws-pdk-nx-monorepo.NxMonorepoProject", version: "0.0.0" };
function getPluginPath() {
    return path.join(__dirname, "plugin/nx-monorepo-plugin.js");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibngtbW9ub3JlcG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbngtbW9ub3JlcG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxRUFBcUU7QUFDckUsc0NBQXNDO0FBRXRDLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQWlFO0FBQ2pFLHNEQUcrQjtBQUUvQixNQUFNLHVCQUF1QixHQUFXLG1DQUFtQyxDQUFDO0FBRTVFOztHQUVHO0FBQ0gsSUFBWSx1QkFlWDtBQWZELFdBQVksdUJBQXVCO0lBQ2pDOzs7OztPQUtHO0lBQ0gsd0NBQWEsQ0FBQTtJQUNiOzs7OztPQUtHO0lBQ0gsd0RBQTZCLENBQUE7QUFDL0IsQ0FBQyxFQWZXLHVCQUF1QixHQUF2QiwrQkFBdUIsS0FBdkIsK0JBQXVCLFFBZWxDO0FBbUREOzs7OztHQUtHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSw4QkFBaUI7SUFJdEQsWUFBWSxPQUFpQztRQUMzQyxLQUFLLENBQUM7WUFDSixHQUFHLE9BQU87WUFDVixNQUFNLEVBQUUsS0FBSztZQUNiLElBQUksRUFBRSxLQUFLO1lBQ1gsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsSUFBSTtZQUNkLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsVUFBVSxFQUFFLEtBQUs7WUFDakIsb0JBQW9CLEVBQUUsVUFBVTtTQUNqQyxDQUFDLENBQUM7UUFkWSx5QkFBb0IsR0FBZ0MsRUFBRSxDQUFDO1FBQ3ZELGlCQUFZLEdBQWMsRUFBRSxDQUFDO1FBZTVDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUV6Qyx5Q0FBeUM7UUFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXZDLHNEQUFzRDtRQUN0RCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pCLElB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QyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNULENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDaEMsR0FBRyxDQUFDO2FBQ0wsQ0FBQyxFQUNGLEVBQUUsQ0FDSCxDQUFDO1lBQ0YsUUFBUSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFFM0IsSUFBSSxpQkFBUSxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUU7Z0JBQ3ZDLEdBQUcsRUFBRSxRQUFRO2dCQUNiLFFBQVEsRUFBRSxJQUFJO2FBQ2YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFTCxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDaEIsQ0FBQzs7QUE1SkgsOENBNkpDOzs7QUFFRCxTQUFTLGFBQWE7SUFDcEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0FBQzlELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgSWdub3JlRmlsZSwgSnNvbkZpbGUsIFByb2plY3QsIFRleHRGaWxlIH0gZnJvbSBcInByb2plblwiO1xuaW1wb3J0IHtcbiAgVHlwZVNjcmlwdFByb2plY3QsXG4gIFR5cGVTY3JpcHRQcm9qZWN0T3B0aW9ucyxcbn0gZnJvbSBcInByb2plbi9saWIvdHlwZXNjcmlwdFwiO1xuXG5jb25zdCBOWF9NT05PUkVQT19QTFVHSU5fUEFUSDogc3RyaW5nID0gXCIubngvcGx1Z2lucy9ueC1tb25vcmVwby1wbHVnaW4uanNcIjtcblxuLyoqXG4gKiBTdXBwb3J0ZWQgZW51bXMgZm9yIGEgVGFyZ2V0RGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGVudW0gVGFyZ2V0RGVwZW5kZW5jeVByb2plY3Qge1xuICAvKipcbiAgICogT25seSByZWx5IG9uIHRoZSBwYWNrYWdlIHdoZXJlIHRoZSB0YXJnZXQgaXMgY2FsbGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzdWFsbHkgZG9uZSBmb3IgdGVzdCBsaWtlIHRhcmdldHMgd2hlcmUgeW91IG9ubHkgd2FudCB0byBydW4gdW5pdFxuICAgKiB0ZXN0cyBvbiB0aGUgdGFyZ2V0IHBhY2thZ2VzIHdpdGhvdXQgdGVzdGluZyBhbGwgZGVwZW5kZW50IHBhY2thZ2VzLlxuICAgKi9cbiAgU0VMRiA9IFwic2VsZlwiLFxuICAvKipcbiAgICogVGFyZ2V0IHJlbGllcyBvbiBleGVjdXRpbmcgdGhlIHRhcmdldCBhZ2FpbnN0IGFsbCBkZXBlbmRlbmNpZXMgZmlyc3QuXG4gICAqXG4gICAqIFRoaXMgaXMgdXN1YWxseSBkb25lIGZvciBidWlsZCBsaWtlIHRhcmdldHMgd2hlcmUgeW91IHdhbnQgdG8gYnVpbGQgYWxsXG4gICAqIGRlcGVuZGFudCBwcm9qZWN0cyBmaXJzdC5cbiAgICovXG4gIERFUEVOREVOQ0lFUyA9IFwiZGVwZW5kZW5jaWVzXCIsXG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBOWCBUYXJnZXQgRGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUYXJnZXREZXBlbmRlbmN5IHtcbiAgLyoqXG4gICAqIFByb2plbiB0YXJnZXQgaS5lOiBidWlsZCwgdGVzdCwgZXRjXG4gICAqL1xuICByZWFkb25seSB0YXJnZXQ6IHN0cmluZztcblxuICAvKipcbiAgICogVGFyZ2V0IGRlcGVuZGVuY2llcy5cbiAgICovXG4gIHJlYWRvbmx5IHByb2plY3RzOiBUYXJnZXREZXBlbmRlbmN5UHJvamVjdDtcbn1cblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciBueCB0YXJnZXREZXBlbmRlbmNpZXMuXG4gKi9cbmV4cG9ydCB0eXBlIFRhcmdldERlcGVuZGVuY2llcyA9IHsgW3RhcmdldDogc3RyaW5nXTogVGFyZ2V0RGVwZW5kZW5jeVtdIH07XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgTnhNb25vcmVwb1Byb2plY3QuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTnhNb25vcmVwb1Byb2plY3RPcHRpb25zIGV4dGVuZHMgVHlwZVNjcmlwdFByb2plY3RPcHRpb25zIHtcbiAgLyoqXG4gICAqIENvbmZpZ3VyYXRpb24gZm9yIE5YIFRhcmdldERlcGVuZGVuY2llcy5cbiAgICpcbiAgICogQGxpbmsgaHR0cHM6Ly9ueC5kZXYvY29uZmlndXJhdGlvbi9wYWNrYWdlanNvbiN0YXJnZXQtZGVwZW5kZW5jaWVzXG4gICAqIEBkZWZhdWx0IHt9XG4gICAqL1xuICByZWFkb25seSB0YXJnZXREZXBlbmRlbmNpZXM/OiBUYXJnZXREZXBlbmRlbmNpZXM7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgcGF0dGVybnMgdG8gaW5jbHVkZSBpbiB0aGUgLm54aWdub3JlIGZpbGUuXG4gICAqXG4gICAqIEBsaW5rIGh0dHBzOi8vbnguZGV2L2NvbmZpZ3VyYXRpb24vcGFja2FnZWpzb24jbnhpZ25vcmVcbiAgICogQGRlZmF1bHQgW11cbiAgICovXG4gIHJlYWRvbmx5IG54SWdub3JlUGF0dGVybnM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogTGlzdCBvZiBwYWNrYWdlIGdsb2JzIHRvIGV4Y2x1ZGUgZnJvbSBob2lzdGluZyBpbiB0aGUgd29ya3NwYWNlLlxuICAgKlxuICAgKiBAbGluayBodHRwczovL2NsYXNzaWMueWFybnBrZy5jb20vYmxvZy8yMDE4LzAyLzE1L25vaG9pc3QvXG4gICAqIEBkZWZhdWx0IFtdXG4gICAqL1xuICByZWFkb25seSBub0hvaXN0R2xvYnM/OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBUaGlzIHByb2plY3QgdHlwZSB3aWxsIGJvb3RzdHJhcCBhIE5YIGJhc2VkIG1vbm9yZXBvIHdpdGggc3VwcG9ydCBmb3IgcG9seWdvdFxuICogYnVpbGRzLCBidWlsZCBjYWNoaW5nLCBkZXBlbmRlbmN5IGdyYXBoIHZpc3VhbGl6YXRpb24gYW5kIG11Y2ggbW9yZS5cbiAqXG4gKiBAcGppZCBueC1tb25vcmVwb1xuICovXG5leHBvcnQgY2xhc3MgTnhNb25vcmVwb1Byb2plY3QgZXh0ZW5kcyBUeXBlU2NyaXB0UHJvamVjdCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgaW1wbGljaXREZXBlbmRlbmNpZXM6IHsgW3BrZzogc3RyaW5nXTogc3RyaW5nW10gfSA9IHt9O1xuICBwcml2YXRlIHJlYWRvbmx5IG5vSG9pc3RHbG9icz86IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogTnhNb25vcmVwb1Byb2plY3RPcHRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGdpdGh1YjogZmFsc2UsXG4gICAgICBqZXN0OiBmYWxzZSxcbiAgICAgIHBhY2thZ2U6IGZhbHNlLFxuICAgICAgcHJldHRpZXI6IHRydWUsXG4gICAgICBwcm9qZW5yY1RzOiB0cnVlLFxuICAgICAgcmVsZWFzZTogZmFsc2UsXG4gICAgICBzYW1wbGVDb2RlOiBmYWxzZSxcbiAgICAgIGRlZmF1bHRSZWxlYXNlQnJhbmNoOiBcIm1haW5saW5lXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLm5vSG9pc3RHbG9icyA9IG9wdGlvbnMubm9Ib2lzdEdsb2JzO1xuXG4gICAgLy8gTmV2ZXIgcHVibGlzaCBhIG1vbm9yZXBvIHJvb3QgcGFja2FnZS5cbiAgICB0aGlzLnBhY2thZ2UuYWRkRmllbGQoXCJwcml2YXRlXCIsIHRydWUpO1xuXG4gICAgLy8gTm8gbmVlZCB0byBjb21waWxlIG9yIHRlc3QgYSBtb25vcmVwbyByb290IHBhY2thZ2UuXG4gICAgdGhpcy5jb21waWxlVGFzay5yZXNldCgpO1xuICAgIHRoaXMudGVzdFRhc2sucmVzZXQoKTtcblxuICAgIHRoaXMuYWRkRGV2RGVwcyhcIkBucndsL2NsaVwiLCBcIkBucndsL3dvcmtzcGFjZVwiKTtcblxuICAgIG5ldyBJZ25vcmVGaWxlKHRoaXMsIFwiLm54aWdub3JlXCIpLmV4Y2x1ZGUoXG4gICAgICBcInRlc3QtcmVwb3J0c1wiLFxuICAgICAgXCJ0YXJnZXRcIixcbiAgICAgIFwiLmVudlwiLFxuICAgICAgXCIucHl0ZXN0X2NhY2hlXCIsXG4gICAgICAuLi4ob3B0aW9ucy5ueElnbm9yZVBhdHRlcm5zIHx8IFtdKVxuICAgICk7XG5cbiAgICBuZXcgVGV4dEZpbGUodGhpcywgTlhfTU9OT1JFUE9fUExVR0lOX1BBVEgsIHtcbiAgICAgIHJlYWRvbmx5OiB0cnVlLFxuICAgICAgbGluZXM6IGZzLnJlYWRGaWxlU3luYyhnZXRQbHVnaW5QYXRoKCkpLnRvU3RyaW5nKFwidXRmLThcIikuc3BsaXQoXCJcXG5cIiksXG4gICAgfSk7XG5cbiAgICBuZXcgSnNvbkZpbGUodGhpcywgXCJueC5qc29uXCIsIHtcbiAgICAgIG9iajoge1xuICAgICAgICBleHRlbmRzOiBcIkBucndsL3dvcmtzcGFjZS9wcmVzZXRzL25wbS5qc29uXCIsXG4gICAgICAgIHBsdWdpbnM6IFtgLi8ke05YX01PTk9SRVBPX1BMVUdJTl9QQVRIfWBdLFxuICAgICAgICBucG1TY29wZTogXCJtb25vcmVwb1wiLFxuICAgICAgICB0YXNrc1J1bm5lck9wdGlvbnM6IHtcbiAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICBydW5uZXI6IFwiQG5yd2wvd29ya3NwYWNlL3Rhc2tzLXJ1bm5lcnMvZGVmYXVsdFwiLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICB1c2VEYWVtb25Qcm9jZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgY2FjaGVhYmxlT3BlcmF0aW9uczogW1wiYnVpbGRcIiwgXCJ0ZXN0XCJdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBpbXBsaWNpdERlcGVuZGVuY2llczogdGhpcy5pbXBsaWNpdERlcGVuZGVuY2llcyxcbiAgICAgICAgdGFyZ2V0RGVwZW5kZW5jaWVzOiB7XG4gICAgICAgICAgYnVpbGQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGFyZ2V0OiBcImJ1aWxkXCIsXG4gICAgICAgICAgICAgIHByb2plY3RzOiBcImRlcGVuZGVuY2llc1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIC4uLihvcHRpb25zLnRhcmdldERlcGVuZGVuY2llcyB8fCB7fSksXG4gICAgICAgIH0sXG4gICAgICAgIGFmZmVjdGVkOiB7XG4gICAgICAgICAgZGVmYXVsdEJhc2U6IFwibWFpbmxpbmVcIixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIGltcGxpY2l0IGRlcGVuZGVuY3kgYmV0d2VlbiB0d28gUHJvamVjdCdzLiBUaGlzIGlzIHR5cGljYWxseVxuICAgKiB1c2VkIGluIHBvbHlnb3QgcmVwb3Mgd2hlcmUgYSBUeXBlc2NyaXB0IHByb2plY3Qgd2FudHMgYSBidWlsZCBkZXBlbmRlbmN5XG4gICAqIG9uIGEgUHl0aG9uIHByb2plY3QgYXMgYW4gZXhhbXBsZS5cbiAgICpcbiAgICogQHBhcmFtIGRlcGVuZGVudCBwcm9qZWN0IHlvdSB3YW50IHRvIGhhdmUgdGhlIGRlcGVuZGVuY3kuXG4gICAqIEBwYXJhbSBkZXBlbmRlZSBwcm9qZWN0IHlvdSB3aXNoIHRvIGRlcGVuZCBvbi5cbiAgICovXG4gIHB1YmxpYyBhZGRJbXBsaWNpdERlcGVuZGVuY3koZGVwZW5kZW50OiBQcm9qZWN0LCBkZXBlbmRlZTogUHJvamVjdCkge1xuICAgIGlmICh0aGlzLmltcGxpY2l0RGVwZW5kZW5jaWVzW2RlcGVuZGVudC5uYW1lXSkge1xuICAgICAgdGhpcy5pbXBsaWNpdERlcGVuZGVuY2llc1tkZXBlbmRlbnQubmFtZV0ucHVzaChkZXBlbmRlZS5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pbXBsaWNpdERlcGVuZGVuY2llc1tkZXBlbmRlbnQubmFtZV0gPSBbZGVwZW5kZWUubmFtZV07XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIHRoaXMgaGFjayBvbmNlIHN1YlByb2plY3RzIGlzIG1hZGUgcHVibGljIGluIFByb2plblxuICBwcml2YXRlIGdldCBzdWJQcm9qZWN0cygpOiBQcm9qZWN0W10ge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBzdWJQcm9qZWN0czogUHJvamVjdFtdID0gdGhpcy5zdWJwcm9qZWN0cyB8fCBbXTtcbiAgICByZXR1cm4gc3ViUHJvamVjdHMuc29ydCgoYSwgYikgPT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSk7XG4gIH1cblxuICAvKipcbiAgICogQGluaGVyaXREb2NcbiAgICovXG4gIHByZVN5bnRoZXNpemUoKSB7XG4gICAgc3VwZXIucHJlU3ludGhlc2l6ZSgpO1xuXG4gICAgLy8gQWRkIHdvcmtzcGFjZXMgZm9yIGVhY2ggc3VicHJvamVjdFxuICAgIHRoaXMucGFja2FnZS5hZGRGaWVsZChcIndvcmtzcGFjZXNcIiwge1xuICAgICAgcGFja2FnZXM6IHRoaXMuc3ViUHJvamVjdHMubWFwKChzdWJQcm9qZWN0KSA9PlxuICAgICAgICBwYXRoLnJlbGF0aXZlKHRoaXMub3V0ZGlyLCBzdWJQcm9qZWN0Lm91dGRpcilcbiAgICAgICksXG4gICAgICBub2hvaXN0OiB0aGlzLm5vSG9pc3RHbG9icyxcbiAgICB9KTtcblxuICAgIC8vIERpc2FibGUgZGVmYXVsdCB0YXNrIG9uIHN1YnByb2plY3RzIGFzIHRoaXMgaXNuJ3Qgc3VwcG9ydGVkIGluIGEgbW9ub3JlcG9cbiAgICB0aGlzLnN1YlByb2plY3RzLmZvckVhY2goKHN1YlByb2plY3QpID0+IHN1YlByb2plY3QuZGVmYXVsdFRhc2s/LnJlc2V0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0RG9jXG4gICAqL1xuICBzeW50aCgpIHtcbiAgICAvLyBDaGVjayB0byBzZWUgaWYgYSBuZXcgc3ViUHJvamVjdCB3YXMgYWRkZWRcbiAgICBjb25zdCBuZXdTdWJQcm9qZWN0ID0gdGhpcy5zdWJQcm9qZWN0cy5maW5kKFxuICAgICAgKHN1YlByb2plY3QpID0+ICFmcy5leGlzdHNTeW5jKHN1YlByb2plY3Qub3V0ZGlyKVxuICAgICk7XG5cbiAgICAvLyBOZWVkIHRvIHN5bnRoIGJlZm9yZSBnZW5lcmF0aW5nIHRoZSBwYWNrYWdlLmpzb24gb3RoZXJ3aXNlIHRoZSBzdWJkaXJlY3Rvcnkgd29uJ3QgZXhpc3RcbiAgICBuZXdTdWJQcm9qZWN0ICYmIHN1cGVyLnN5bnRoKCk7XG5cbiAgICB0aGlzLnN1YlByb2plY3RzXG4gICAgICAuZmlsdGVyKFxuICAgICAgICAoc3ViUHJvamVjdCkgPT5cbiAgICAgICAgICAhc3ViUHJvamVjdC50cnlGaW5kT2JqZWN0RmlsZShcInBhY2thZ2UuanNvblwiKSB8fFxuICAgICAgICAgIChmcy5leGlzdHNTeW5jKGAke3N1YlByb2plY3Qub3V0ZGlyfS9wYWNrYWdlLmpzb25gKSAmJlxuICAgICAgICAgICAgSlNPTi5wYXJzZShcbiAgICAgICAgICAgICAgZnMucmVhZEZpbGVTeW5jKGAke3N1YlByb2plY3Qub3V0ZGlyfS9wYWNrYWdlLmpzb25gKS50b1N0cmluZygpXG4gICAgICAgICAgICApLl9fcGRrX18pXG4gICAgICApXG4gICAgICAuZm9yRWFjaCgoc3ViUHJvamVjdCkgPT4ge1xuICAgICAgICAvLyBnZW5lcmF0ZSBhIHBhY2thZ2UuanNvbiBpZiBub3QgZm91bmRcbiAgICAgICAgY29uc3QgbWFuaWZlc3Q6IGFueSA9IHt9O1xuICAgICAgICBtYW5pZmVzdC5uYW1lID0gc3ViUHJvamVjdC5uYW1lO1xuICAgICAgICBtYW5pZmVzdC5wcml2YXRlID0gdHJ1ZTtcbiAgICAgICAgbWFuaWZlc3QuX19wZGtfXyA9IHRydWU7XG4gICAgICAgIG1hbmlmZXN0LnNjcmlwdHMgPSBzdWJQcm9qZWN0LnRhc2tzLmFsbC5yZWR1Y2UoXG4gICAgICAgICAgKHAsIGMpID0+ICh7XG4gICAgICAgICAgICBbYy5uYW1lXTogYG5weCBwcm9qZW4gJHtjLm5hbWV9YCxcbiAgICAgICAgICAgIC4uLnAsXG4gICAgICAgICAgfSksXG4gICAgICAgICAge31cbiAgICAgICAgKTtcbiAgICAgICAgbWFuaWZlc3QudmVyc2lvbiA9IFwiMC4wLjBcIjtcblxuICAgICAgICBuZXcgSnNvbkZpbGUoc3ViUHJvamVjdCwgXCJwYWNrYWdlLmpzb25cIiwge1xuICAgICAgICAgIG9iajogbWFuaWZlc3QsXG4gICAgICAgICAgcmVhZG9ubHk6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBzdXBlci5zeW50aCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFBsdWdpblBhdGgoKSB7XG4gIHJldHVybiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcInBsdWdpbi9ueC1tb25vcmVwby1wbHVnaW4uanNcIik7XG59XG4iXX0=