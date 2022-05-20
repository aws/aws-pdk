import { Project } from "projen";
import { TypeScriptProject, TypeScriptProjectOptions } from "projen/lib/typescript";
/**
 * Supported enums for a TargetDependency.
 */
export declare enum TargetDependencyProject {
    /**
     * Only rely on the package where the target is called.
     *
     * This is usually done for test like targets where you only want to run unit
     * tests on the target packages without testing all dependent packages.
     */
    SELF = "self",
    /**
     * Target relies on executing the target against all dependencies first.
     *
     * This is usually done for build like targets where you want to build all
     * dependant projects first.
     */
    DEPENDENCIES = "dependencies"
}
/**
 * Represents an NX Target Dependency.
 */
export interface TargetDependency {
    /**
     * Projen target i.e: build, test, etc
     */
    readonly target: string;
    /**
     * Target dependencies.
     */
    readonly projects: TargetDependencyProject;
}
/**
 * Configuration for nx targetDependencies.
 */
export declare type TargetDependencies = {
    [target: string]: TargetDependency[];
};
/**
 * Configuration options for the NxMonorepoProject.
 */
export interface NxMonorepoProjectOptions extends TypeScriptProjectOptions {
    /**
     * Configuration for NX TargetDependencies.
     *
     * @link https://nx.dev/configuration/packagejson#target-dependencies
     * @default {}
     */
    readonly targetDependencies?: TargetDependencies;
    /**
     * List of patterns to include in the .nxignore file.
     *
     * @link https://nx.dev/configuration/packagejson#nxignore
     * @default []
     */
    readonly nxIgnorePatterns?: string[];
    /**
     * List of package globs to exclude from hoisting in the workspace.
     *
     * @link https://classic.yarnpkg.com/blog/2018/02/15/nohoist/
     * @default []
     */
    readonly noHoistGlobs?: string[];
}
/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid nx-monorepo
 */
export declare class NxMonorepoProject extends TypeScriptProject {
    private readonly implicitDependencies;
    private readonly noHoistGlobs?;
    constructor(options: NxMonorepoProjectOptions);
    /**
     * Create an implicit dependency between two Project's. This is typically
     * used in polygot repos where a Typescript project wants a build dependency
     * on a Python project as an example.
     *
     * @param dependent project you want to have the dependency.
     * @param dependee project you wish to depend on.
     */
    addImplicitDependency(dependent: Project, dependee: Project): void;
    private get subProjects();
    /**
     * @inheritDoc
     */
    preSynthesize(): void;
    /**
     * @inheritDoc
     */
    synth(): void;
}
//# sourceMappingURL=nx-monorepo.d.ts.map