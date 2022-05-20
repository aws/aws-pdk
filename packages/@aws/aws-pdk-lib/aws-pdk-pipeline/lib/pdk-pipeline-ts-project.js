"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipelineTsProject = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
_a = JSII_RTTI_SYMBOL_1;
PDKPipelineTsProject[_a] = { fqn: "@aws/aws-pdk-pipeline.PDKPipelineTsProject", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLXRzLXByb2plY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcGRrLXBpcGVsaW5lLXRzLXByb2plY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxRUFBcUU7QUFDckUsc0NBQXNDO0FBRXRDLDZCQUE2QjtBQUM3QixtQ0FBbUM7QUFDbkMsOENBRzJCO0FBUTNCOzs7O0dBSUc7QUFDSCxNQUFhLG9CQUFxQixTQUFRLDRCQUFtQjtJQUMzRCxZQUFZLE9BQW9DO1FBQzlDLEtBQUssQ0FBQztZQUNKLE1BQU0sRUFBRSxLQUFLO1lBQ2IsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsSUFBSTtZQUNkLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsVUFBVSxFQUFFLEtBQUs7WUFDakIsR0FBRyxPQUFPO1lBQ1YsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhLElBQUksYUFBYTtTQUN0RCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFakMsSUFBSSxrQkFBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQy9CLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUNsQixTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxZQUFZLEVBQ1osd0JBQXdCLEVBQ3hCLEtBQUssQ0FDTjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksa0JBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FDbEIsU0FBUyxFQUNULElBQUksRUFDSixTQUFTLEVBQ1QsWUFBWSxFQUNaLHdCQUF3QixFQUN4QixNQUFNLENBQ1A7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDOztBQXBDSCxvREFxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IFNhbXBsZURpciB9IGZyb20gXCJwcm9qZW5cIjtcbmltcG9ydCB7XG4gIEF3c0Nka1R5cGVTY3JpcHRBcHAsXG4gIEF3c0Nka1R5cGVTY3JpcHRBcHBPcHRpb25zLFxufSBmcm9tIFwicHJvamVuL2xpYi9hd3NjZGtcIjtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBQREtQaXBlbGluZVRzUHJvamVjdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQREtQaXBlbGluZVRzUHJvamVjdE9wdGlvbnNcbiAgZXh0ZW5kcyBBd3NDZGtUeXBlU2NyaXB0QXBwT3B0aW9ucyB7fVxuXG4vKipcbiAqIFN5bnRoZXNpemVzIGEgVHlwZXNjcmlwdCBQcm9qZWN0IHdpdGggYSBDSS9DRCBwaXBlbGluZS5cbiAqXG4gKiBAcGppZCBwZGstcGlwZWxpbmUtdHNcbiAqL1xuZXhwb3J0IGNsYXNzIFBES1BpcGVsaW5lVHNQcm9qZWN0IGV4dGVuZHMgQXdzQ2RrVHlwZVNjcmlwdEFwcCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFBES1BpcGVsaW5lVHNQcm9qZWN0T3B0aW9ucykge1xuICAgIHN1cGVyKHtcbiAgICAgIGdpdGh1YjogZmFsc2UsXG4gICAgICBwYWNrYWdlOiBmYWxzZSxcbiAgICAgIHByZXR0aWVyOiB0cnVlLFxuICAgICAgcHJvamVucmNUczogdHJ1ZSxcbiAgICAgIHJlbGVhc2U6IGZhbHNlLFxuICAgICAgc2FtcGxlQ29kZTogZmFsc2UsXG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgYXBwRW50cnlwb2ludDogb3B0aW9ucy5hcHBFbnRyeXBvaW50IHx8IFwicGlwZWxpbmUudHNcIixcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkRGVwcyhcIkBhd3MvYXdzLXBkay1saWJcIik7XG5cbiAgICBuZXcgU2FtcGxlRGlyKHRoaXMsIHRoaXMuc3JjZGlyLCB7XG4gICAgICBzb3VyY2VEaXI6IHBhdGguam9pbihcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICBcIi4uXCIsXG4gICAgICAgIFwic2FtcGxlc1wiLFxuICAgICAgICBcInR5cGVzY3JpcHRcIixcbiAgICAgICAgXCJwZGstcGlwZWxpbmUtc2FtcGxlLXRzXCIsXG4gICAgICAgIFwic3JjXCJcbiAgICAgICksXG4gICAgfSk7XG5cbiAgICBuZXcgU2FtcGxlRGlyKHRoaXMsIHRoaXMudGVzdGRpciwge1xuICAgICAgc291cmNlRGlyOiBwYXRoLmpvaW4oXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgXCIuLlwiLFxuICAgICAgICBcInNhbXBsZXNcIixcbiAgICAgICAgXCJ0eXBlc2NyaXB0XCIsXG4gICAgICAgIFwicGRrLXBpcGVsaW5lLXNhbXBsZS10c1wiLFxuICAgICAgICBcInRlc3RcIlxuICAgICAgKSxcbiAgICB9KTtcbiAgfVxufVxuIl19