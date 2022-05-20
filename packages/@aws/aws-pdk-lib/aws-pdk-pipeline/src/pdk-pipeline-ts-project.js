"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipelineTsProject = void 0;
const path = require("path");
const projen_1 = require("projen");
const awscdk_1 = require("projen/lib/awscdk");
/**
 * Synthesizes a Typescript Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-ts
 */
class PDKPipelineTsProject extends awscdk_1.AwsCdkTypeScriptApp {
    constructor(options) {
        super({
            github: false,
            package: false,
            prettier: true,
            projenrcTs: true,
            release: false,
            sampleCode: false,
            ...options,
            appEntrypoint: options.appEntrypoint || "pipeline.ts",
        });
        this.addDeps("@aws/aws-pdk-lib");
        new projen_1.SampleDir(this, this.srcdir, {
            sourceDir: path.join(__dirname, "..", "samples", "typescript", "pdk-pipeline-sample-ts", "src"),
        });
        new projen_1.SampleDir(this, this.testdir, {
            sourceDir: path.join(__dirname, "..", "samples", "typescript", "pdk-pipeline-sample-ts", "test"),
        });
    }
}
exports.PDKPipelineTsProject = PDKPipelineTsProject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLXRzLXByb2plY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwZGstcGlwZWxpbmUtdHMtcHJvamVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUVBQXFFO0FBQ3JFLHNDQUFzQzs7O0FBRXRDLDZCQUE2QjtBQUM3QixtQ0FBbUM7QUFDbkMsOENBRzJCO0FBUTNCOzs7O0dBSUc7QUFDSCxNQUFhLG9CQUFxQixTQUFRLDRCQUFtQjtJQUMzRCxZQUFZLE9BQW9DO1FBQzlDLEtBQUssQ0FBQztZQUNKLE1BQU0sRUFBRSxLQUFLO1lBQ2IsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsSUFBSTtZQUNkLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsVUFBVSxFQUFFLEtBQUs7WUFDakIsR0FBRyxPQUFPO1lBQ1YsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhLElBQUksYUFBYTtTQUN0RCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFakMsSUFBSSxrQkFBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQy9CLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUNsQixTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxZQUFZLEVBQ1osd0JBQXdCLEVBQ3hCLEtBQUssQ0FDTjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksa0JBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FDbEIsU0FBUyxFQUNULElBQUksRUFDSixTQUFTLEVBQ1QsWUFBWSxFQUNaLHdCQUF3QixFQUN4QixNQUFNLENBQ1A7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFyQ0Qsb0RBcUNDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBTYW1wbGVEaXIgfSBmcm9tIFwicHJvamVuXCI7XG5pbXBvcnQge1xuICBBd3NDZGtUeXBlU2NyaXB0QXBwLFxuICBBd3NDZGtUeXBlU2NyaXB0QXBwT3B0aW9ucyxcbn0gZnJvbSBcInByb2plbi9saWIvYXdzY2RrXCI7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgUERLUGlwZWxpbmVUc1Byb2plY3QuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUERLUGlwZWxpbmVUc1Byb2plY3RPcHRpb25zXG4gIGV4dGVuZHMgQXdzQ2RrVHlwZVNjcmlwdEFwcE9wdGlvbnMge31cblxuLyoqXG4gKiBTeW50aGVzaXplcyBhIFR5cGVzY3JpcHQgUHJvamVjdCB3aXRoIGEgQ0kvQ0QgcGlwZWxpbmUuXG4gKlxuICogQHBqaWQgcGRrLXBpcGVsaW5lLXRzXG4gKi9cbmV4cG9ydCBjbGFzcyBQREtQaXBlbGluZVRzUHJvamVjdCBleHRlbmRzIEF3c0Nka1R5cGVTY3JpcHRBcHAge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBQREtQaXBlbGluZVRzUHJvamVjdE9wdGlvbnMpIHtcbiAgICBzdXBlcih7XG4gICAgICBnaXRodWI6IGZhbHNlLFxuICAgICAgcGFja2FnZTogZmFsc2UsXG4gICAgICBwcmV0dGllcjogdHJ1ZSxcbiAgICAgIHByb2plbnJjVHM6IHRydWUsXG4gICAgICByZWxlYXNlOiBmYWxzZSxcbiAgICAgIHNhbXBsZUNvZGU6IGZhbHNlLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGFwcEVudHJ5cG9pbnQ6IG9wdGlvbnMuYXBwRW50cnlwb2ludCB8fCBcInBpcGVsaW5lLnRzXCIsXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZERlcHMoXCJAYXdzL2F3cy1wZGstbGliXCIpO1xuXG4gICAgbmV3IFNhbXBsZURpcih0aGlzLCB0aGlzLnNyY2Rpciwge1xuICAgICAgc291cmNlRGlyOiBwYXRoLmpvaW4oXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgXCIuLlwiLFxuICAgICAgICBcInNhbXBsZXNcIixcbiAgICAgICAgXCJ0eXBlc2NyaXB0XCIsXG4gICAgICAgIFwicGRrLXBpcGVsaW5lLXNhbXBsZS10c1wiLFxuICAgICAgICBcInNyY1wiXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgbmV3IFNhbXBsZURpcih0aGlzLCB0aGlzLnRlc3RkaXIsIHtcbiAgICAgIHNvdXJjZURpcjogcGF0aC5qb2luKFxuICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgIFwiLi5cIixcbiAgICAgICAgXCJzYW1wbGVzXCIsXG4gICAgICAgIFwidHlwZXNjcmlwdFwiLFxuICAgICAgICBcInBkay1waXBlbGluZS1zYW1wbGUtdHNcIixcbiAgICAgICAgXCJ0ZXN0XCJcbiAgICAgICksXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==