"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipelinePyProject = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const fs = require("fs");
const path = require("path");
const projen_1 = require("projen");
const awscdk_1 = require("projen/lib/awscdk");
const python_1 = require("projen/lib/python");
/**
 * Synthesizes a Python Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-py
 */
class PDKPipelinePyProject extends awscdk_1.AwsCdkPythonApp {
    constructor(options) {
        super({
            github: false,
            sample: false,
            pytest: false,
            ...options,
            appEntrypoint: options.appEntrypoint || `${options.moduleName}/pipeline.py`,
        });
        ["aws_prototyping_sdk", "pyhumps"].forEach((dep) => this.addDependency(dep));
        new projen_1.SampleDir(this, this.moduleName, {
            sourceDir: path.join(__dirname, "..", "samples", "python", "pdk-pipeline-sample-py", "infra"),
        });
        this.pytest = new python_1.Pytest(this, options.pytestOptions);
        new projen_1.SampleDir(this, this.testdir, {
            files: {
                "__init__.py": "",
                "test_pipeline.py": fs
                    .readFileSync(path.join(__dirname, "..", "samples", "python", "pdk-pipeline-sample-py", "tests", "test_pipeline.py"))
                    .toString()
                    .replace("infra.", `${this.moduleName}.`),
            },
        });
    }
}
exports.PDKPipelinePyProject = PDKPipelinePyProject;
_a = JSII_RTTI_SYMBOL_1;
PDKPipelinePyProject[_a] = { fqn: "@aws/aws-pdk-pipeline.PDKPipelinePyProject", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLXB5LXByb2plY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcGRrLXBpcGVsaW5lLXB5LXByb2plY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxRUFBcUU7QUFDckUsc0NBQXNDO0FBRXRDLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQW1DO0FBQ25DLDhDQUE0RTtBQUM1RSw4Q0FBMkM7QUFPM0M7Ozs7R0FJRztBQUNILE1BQWEsb0JBQXFCLFNBQVEsd0JBQWU7SUFDdkQsWUFBWSxPQUFvQztRQUM5QyxLQUFLLENBQUM7WUFDSixNQUFNLEVBQUUsS0FBSztZQUNiLE1BQU0sRUFBRSxLQUFLO1lBQ2IsTUFBTSxFQUFFLEtBQUs7WUFDYixHQUFHLE9BQU87WUFDVixhQUFhLEVBQ1gsT0FBTyxDQUFDLGFBQWEsSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLGNBQWM7U0FDL0QsQ0FBQyxDQUFDO1FBRUgsQ0FBQyxxQkFBcUIsRUFBRSxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUN4QixDQUFDO1FBRUYsSUFBSSxrQkFBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25DLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUNsQixTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxRQUFRLEVBQ1Isd0JBQXdCLEVBQ3hCLE9BQU8sQ0FDUjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV0RCxJQUFJLGtCQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEMsS0FBSyxFQUFFO2dCQUNMLGFBQWEsRUFBRSxFQUFFO2dCQUNqQixrQkFBa0IsRUFBRSxFQUFFO3FCQUNuQixZQUFZLENBQ1gsSUFBSSxDQUFDLElBQUksQ0FDUCxTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxRQUFRLEVBQ1Isd0JBQXdCLEVBQ3hCLE9BQU8sRUFDUCxrQkFBa0IsQ0FDbkIsQ0FDRjtxQkFDQSxRQUFRLEVBQUU7cUJBQ1YsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQzthQUM1QztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7O0FBL0NILG9EQWdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjBcblxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBTYW1wbGVEaXIgfSBmcm9tIFwicHJvamVuXCI7XG5pbXBvcnQgeyBBd3NDZGtQeXRob25BcHAsIEF3c0Nka1B5dGhvbkFwcE9wdGlvbnMgfSBmcm9tIFwicHJvamVuL2xpYi9hd3NjZGtcIjtcbmltcG9ydCB7IFB5dGVzdCB9IGZyb20gXCJwcm9qZW4vbGliL3B5dGhvblwiO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIFBES1BpcGVsaW5lUHlQcm9qZWN0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBES1BpcGVsaW5lUHlQcm9qZWN0T3B0aW9ucyBleHRlbmRzIEF3c0Nka1B5dGhvbkFwcE9wdGlvbnMge31cblxuLyoqXG4gKiBTeW50aGVzaXplcyBhIFB5dGhvbiBQcm9qZWN0IHdpdGggYSBDSS9DRCBwaXBlbGluZS5cbiAqXG4gKiBAcGppZCBwZGstcGlwZWxpbmUtcHlcbiAqL1xuZXhwb3J0IGNsYXNzIFBES1BpcGVsaW5lUHlQcm9qZWN0IGV4dGVuZHMgQXdzQ2RrUHl0aG9uQXBwIHtcbiAgY29uc3RydWN0b3Iob3B0aW9uczogUERLUGlwZWxpbmVQeVByb2plY3RPcHRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgZ2l0aHViOiBmYWxzZSxcbiAgICAgIHNhbXBsZTogZmFsc2UsXG4gICAgICBweXRlc3Q6IGZhbHNlLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGFwcEVudHJ5cG9pbnQ6XG4gICAgICAgIG9wdGlvbnMuYXBwRW50cnlwb2ludCB8fCBgJHtvcHRpb25zLm1vZHVsZU5hbWV9L3BpcGVsaW5lLnB5YCxcbiAgICB9KTtcblxuICAgIFtcImF3c19wcm90b3R5cGluZ19zZGtcIiwgXCJweWh1bXBzXCJdLmZvckVhY2goKGRlcCkgPT5cbiAgICAgIHRoaXMuYWRkRGVwZW5kZW5jeShkZXApXG4gICAgKTtcblxuICAgIG5ldyBTYW1wbGVEaXIodGhpcywgdGhpcy5tb2R1bGVOYW1lLCB7XG4gICAgICBzb3VyY2VEaXI6IHBhdGguam9pbihcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICBcIi4uXCIsXG4gICAgICAgIFwic2FtcGxlc1wiLFxuICAgICAgICBcInB5dGhvblwiLFxuICAgICAgICBcInBkay1waXBlbGluZS1zYW1wbGUtcHlcIixcbiAgICAgICAgXCJpbmZyYVwiXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgdGhpcy5weXRlc3QgPSBuZXcgUHl0ZXN0KHRoaXMsIG9wdGlvbnMucHl0ZXN0T3B0aW9ucyk7XG5cbiAgICBuZXcgU2FtcGxlRGlyKHRoaXMsIHRoaXMudGVzdGRpciwge1xuICAgICAgZmlsZXM6IHtcbiAgICAgICAgXCJfX2luaXRfXy5weVwiOiBcIlwiLFxuICAgICAgICBcInRlc3RfcGlwZWxpbmUucHlcIjogZnNcbiAgICAgICAgICAucmVhZEZpbGVTeW5jKFxuICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICAgICAgIFwiLi5cIixcbiAgICAgICAgICAgICAgXCJzYW1wbGVzXCIsXG4gICAgICAgICAgICAgIFwicHl0aG9uXCIsXG4gICAgICAgICAgICAgIFwicGRrLXBpcGVsaW5lLXNhbXBsZS1weVwiLFxuICAgICAgICAgICAgICBcInRlc3RzXCIsXG4gICAgICAgICAgICAgIFwidGVzdF9waXBlbGluZS5weVwiXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICAgIC50b1N0cmluZygpXG4gICAgICAgICAgLnJlcGxhY2UoXCJpbmZyYS5cIiwgYCR7dGhpcy5tb2R1bGVOYW1lfS5gKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==