"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipelinePyProject = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLXB5LXByb2plY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwZGstcGlwZWxpbmUtcHktcHJvamVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUVBQXFFO0FBQ3JFLHNDQUFzQzs7O0FBRXRDLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQW1DO0FBQ25DLDhDQUE0RTtBQUM1RSw4Q0FBMkM7QUFPM0M7Ozs7R0FJRztBQUNILE1BQWEsb0JBQXFCLFNBQVEsd0JBQWU7SUFDdkQsWUFBWSxPQUFvQztRQUM5QyxLQUFLLENBQUM7WUFDSixNQUFNLEVBQUUsS0FBSztZQUNiLE1BQU0sRUFBRSxLQUFLO1lBQ2IsTUFBTSxFQUFFLEtBQUs7WUFDYixHQUFHLE9BQU87WUFDVixhQUFhLEVBQ1gsT0FBTyxDQUFDLGFBQWEsSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLGNBQWM7U0FDL0QsQ0FBQyxDQUFDO1FBRUgsQ0FBQyxxQkFBcUIsRUFBRSxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUN4QixDQUFDO1FBRUYsSUFBSSxrQkFBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25DLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUNsQixTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxRQUFRLEVBQ1Isd0JBQXdCLEVBQ3hCLE9BQU8sQ0FDUjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV0RCxJQUFJLGtCQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEMsS0FBSyxFQUFFO2dCQUNMLGFBQWEsRUFBRSxFQUFFO2dCQUNqQixrQkFBa0IsRUFBRSxFQUFFO3FCQUNuQixZQUFZLENBQ1gsSUFBSSxDQUFDLElBQUksQ0FDUCxTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxRQUFRLEVBQ1Isd0JBQXdCLEVBQ3hCLE9BQU8sRUFDUCxrQkFBa0IsQ0FDbkIsQ0FDRjtxQkFDQSxRQUFRLEVBQUU7cUJBQ1YsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQzthQUM1QztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhERCxvREFnREMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgU2FtcGxlRGlyIH0gZnJvbSBcInByb2plblwiO1xuaW1wb3J0IHsgQXdzQ2RrUHl0aG9uQXBwLCBBd3NDZGtQeXRob25BcHBPcHRpb25zIH0gZnJvbSBcInByb2plbi9saWIvYXdzY2RrXCI7XG5pbXBvcnQgeyBQeXRlc3QgfSBmcm9tIFwicHJvamVuL2xpYi9weXRob25cIjtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBQREtQaXBlbGluZVB5UHJvamVjdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQREtQaXBlbGluZVB5UHJvamVjdE9wdGlvbnMgZXh0ZW5kcyBBd3NDZGtQeXRob25BcHBPcHRpb25zIHt9XG5cbi8qKlxuICogU3ludGhlc2l6ZXMgYSBQeXRob24gUHJvamVjdCB3aXRoIGEgQ0kvQ0QgcGlwZWxpbmUuXG4gKlxuICogQHBqaWQgcGRrLXBpcGVsaW5lLXB5XG4gKi9cbmV4cG9ydCBjbGFzcyBQREtQaXBlbGluZVB5UHJvamVjdCBleHRlbmRzIEF3c0Nka1B5dGhvbkFwcCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFBES1BpcGVsaW5lUHlQcm9qZWN0T3B0aW9ucykge1xuICAgIHN1cGVyKHtcbiAgICAgIGdpdGh1YjogZmFsc2UsXG4gICAgICBzYW1wbGU6IGZhbHNlLFxuICAgICAgcHl0ZXN0OiBmYWxzZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBhcHBFbnRyeXBvaW50OlxuICAgICAgICBvcHRpb25zLmFwcEVudHJ5cG9pbnQgfHwgYCR7b3B0aW9ucy5tb2R1bGVOYW1lfS9waXBlbGluZS5weWAsXG4gICAgfSk7XG5cbiAgICBbXCJhd3NfcHJvdG90eXBpbmdfc2RrXCIsIFwicHlodW1wc1wiXS5mb3JFYWNoKChkZXApID0+XG4gICAgICB0aGlzLmFkZERlcGVuZGVuY3koZGVwKVxuICAgICk7XG5cbiAgICBuZXcgU2FtcGxlRGlyKHRoaXMsIHRoaXMubW9kdWxlTmFtZSwge1xuICAgICAgc291cmNlRGlyOiBwYXRoLmpvaW4oXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgXCIuLlwiLFxuICAgICAgICBcInNhbXBsZXNcIixcbiAgICAgICAgXCJweXRob25cIixcbiAgICAgICAgXCJwZGstcGlwZWxpbmUtc2FtcGxlLXB5XCIsXG4gICAgICAgIFwiaW5mcmFcIlxuICAgICAgKSxcbiAgICB9KTtcblxuICAgIHRoaXMucHl0ZXN0ID0gbmV3IFB5dGVzdCh0aGlzLCBvcHRpb25zLnB5dGVzdE9wdGlvbnMpO1xuXG4gICAgbmV3IFNhbXBsZURpcih0aGlzLCB0aGlzLnRlc3RkaXIsIHtcbiAgICAgIGZpbGVzOiB7XG4gICAgICAgIFwiX19pbml0X18ucHlcIjogXCJcIixcbiAgICAgICAgXCJ0ZXN0X3BpcGVsaW5lLnB5XCI6IGZzXG4gICAgICAgICAgLnJlYWRGaWxlU3luYyhcbiAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAgICAgICBcIi4uXCIsXG4gICAgICAgICAgICAgIFwic2FtcGxlc1wiLFxuICAgICAgICAgICAgICBcInB5dGhvblwiLFxuICAgICAgICAgICAgICBcInBkay1waXBlbGluZS1zYW1wbGUtcHlcIixcbiAgICAgICAgICAgICAgXCJ0ZXN0c1wiLFxuICAgICAgICAgICAgICBcInRlc3RfcGlwZWxpbmUucHlcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgICAudG9TdHJpbmcoKVxuICAgICAgICAgIC5yZXBsYWNlKFwiaW5mcmEuXCIsIGAke3RoaXMubW9kdWxlTmFtZX0uYCksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXX0=