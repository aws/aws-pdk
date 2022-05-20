"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipelineJavaProject = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const path = require("path");
const projen_1 = require("projen");
const awscdk_1 = require("projen/lib/awscdk");
/**
 * Synthesizes a Java Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-java
 */
class PDKPipelineJavaProject extends awscdk_1.AwsCdkJavaApp {
    constructor(options) {
        super({
            sample: false,
            junit: false,
            ...options,
            mainClass: options.mainClass !== "org.acme.MyApp"
                ? options.mainClass
                : 'software.aws.Pipeline -Dexec.classpathScope="test"',
        });
        this.addDependency("software.aws.awsprototypingsdk/aws-pdk-lib@^0");
        this.testTask.exec("mvn test");
        this.addTestDependency("org.junit.jupiter/junit-jupiter-api@5.7.0");
        this.addTestDependency("org.junit.jupiter/junit-jupiter-engine@5.7.0");
        const mainPackage = this.mainClass
            .split(" ")[0]
            .split(".")
            .slice(0, -1)
            .join(".");
        new projen_1.SampleDir(this, path.join("src", "main", "java", ...mainPackage.split(".")), {
            sourceDir: path.join(__dirname, "..", "samples", "java", "pdk-pipeline-sample-java", "src", "main", "java", "software", "aws"),
        });
        new projen_1.SampleDir(this, path.join("src", "test", "java", ...mainPackage.split(".")), {
            sourceDir: path.join(__dirname, "..", "samples", "java", "pdk-pipeline-sample-java", "src", "test", "java", "software", "aws"),
        });
    }
}
exports.PDKPipelineJavaProject = PDKPipelineJavaProject;
_a = JSII_RTTI_SYMBOL_1;
PDKPipelineJavaProject[_a] = { fqn: "@aws/aws-pdk-pipeline.PDKPipelineJavaProject", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLWphdmEtcHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wZGstcGlwZWxpbmUtamF2YS1wcm9qZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEscUVBQXFFO0FBQ3JFLHNDQUFzQztBQUV0Qyw2QkFBNkI7QUFDN0IsbUNBQW1DO0FBQ25DLDhDQUF3RTtBQU94RTs7OztHQUlHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSxzQkFBYTtJQUN2RCxZQUFZLE9BQXNDO1FBQ2hELEtBQUssQ0FBQztZQUNKLE1BQU0sRUFBRSxLQUFLO1lBQ2IsS0FBSyxFQUFFLEtBQUs7WUFDWixHQUFHLE9BQU87WUFDVixTQUFTLEVBQ1AsT0FBTyxDQUFDLFNBQVMsS0FBSyxnQkFBZ0I7Z0JBQ3BDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUztnQkFDbkIsQ0FBQyxDQUFDLG9EQUFvRDtTQUMzRCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxDQUFDLCtDQUErQyxDQUFDLENBQUM7UUFFcEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLDhDQUE4QyxDQUFDLENBQUM7UUFFdkUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVM7YUFDL0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNiLEtBQUssQ0FBQyxHQUFHLENBQUM7YUFDVixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ1osSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsSUFBSSxrQkFBUyxDQUNYLElBQUksRUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUMzRDtZQUNFLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUNsQixTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxNQUFNLEVBQ04sMEJBQTBCLEVBQzFCLEtBQUssRUFDTCxNQUFNLEVBQ04sTUFBTSxFQUNOLFVBQVUsRUFDVixLQUFLLENBQ047U0FDRixDQUNGLENBQUM7UUFDRixJQUFJLGtCQUFTLENBQ1gsSUFBSSxFQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzNEO1lBQ0UsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQ2xCLFNBQVMsRUFDVCxJQUFJLEVBQ0osU0FBUyxFQUNULE1BQU0sRUFDTiwwQkFBMEIsRUFDMUIsS0FBSyxFQUNMLE1BQU0sRUFDTixNQUFNLEVBQ04sVUFBVSxFQUNWLEtBQUssQ0FDTjtTQUNGLENBQ0YsQ0FBQztJQUNKLENBQUM7O0FBM0RILHdEQTREQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjBcblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgU2FtcGxlRGlyIH0gZnJvbSBcInByb2plblwiO1xuaW1wb3J0IHsgQXdzQ2RrSmF2YUFwcCwgQXdzQ2RrSmF2YUFwcE9wdGlvbnMgfSBmcm9tIFwicHJvamVuL2xpYi9hd3NjZGtcIjtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBQREtQaXBlbGluZUphdmFQcm9qZWN0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBES1BpcGVsaW5lSmF2YVByb2plY3RPcHRpb25zIGV4dGVuZHMgQXdzQ2RrSmF2YUFwcE9wdGlvbnMge31cblxuLyoqXG4gKiBTeW50aGVzaXplcyBhIEphdmEgUHJvamVjdCB3aXRoIGEgQ0kvQ0QgcGlwZWxpbmUuXG4gKlxuICogQHBqaWQgcGRrLXBpcGVsaW5lLWphdmFcbiAqL1xuZXhwb3J0IGNsYXNzIFBES1BpcGVsaW5lSmF2YVByb2plY3QgZXh0ZW5kcyBBd3NDZGtKYXZhQXBwIHtcbiAgY29uc3RydWN0b3Iob3B0aW9uczogUERLUGlwZWxpbmVKYXZhUHJvamVjdE9wdGlvbnMpIHtcbiAgICBzdXBlcih7XG4gICAgICBzYW1wbGU6IGZhbHNlLFxuICAgICAganVuaXQ6IGZhbHNlLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIG1haW5DbGFzczpcbiAgICAgICAgb3B0aW9ucy5tYWluQ2xhc3MgIT09IFwib3JnLmFjbWUuTXlBcHBcIlxuICAgICAgICAgID8gb3B0aW9ucy5tYWluQ2xhc3NcbiAgICAgICAgICA6ICdzb2Z0d2FyZS5hd3MuUGlwZWxpbmUgLURleGVjLmNsYXNzcGF0aFNjb3BlPVwidGVzdFwiJyxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkRGVwZW5kZW5jeShcInNvZnR3YXJlLmF3cy5hd3Nwcm90b3R5cGluZ3Nkay9hd3MtcGRrLWxpYkBeMFwiKTtcblxuICAgIHRoaXMudGVzdFRhc2suZXhlYyhcIm12biB0ZXN0XCIpO1xuICAgIHRoaXMuYWRkVGVzdERlcGVuZGVuY3koXCJvcmcuanVuaXQuanVwaXRlci9qdW5pdC1qdXBpdGVyLWFwaUA1LjcuMFwiKTtcbiAgICB0aGlzLmFkZFRlc3REZXBlbmRlbmN5KFwib3JnLmp1bml0Lmp1cGl0ZXIvanVuaXQtanVwaXRlci1lbmdpbmVANS43LjBcIik7XG5cbiAgICBjb25zdCBtYWluUGFja2FnZSA9IHRoaXMubWFpbkNsYXNzXG4gICAgICAuc3BsaXQoXCIgXCIpWzBdXG4gICAgICAuc3BsaXQoXCIuXCIpXG4gICAgICAuc2xpY2UoMCwgLTEpXG4gICAgICAuam9pbihcIi5cIik7XG4gICAgbmV3IFNhbXBsZURpcihcbiAgICAgIHRoaXMsXG4gICAgICBwYXRoLmpvaW4oXCJzcmNcIiwgXCJtYWluXCIsIFwiamF2YVwiLCAuLi5tYWluUGFja2FnZS5zcGxpdChcIi5cIikpLFxuICAgICAge1xuICAgICAgICBzb3VyY2VEaXI6IHBhdGguam9pbihcbiAgICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICAgXCIuLlwiLFxuICAgICAgICAgIFwic2FtcGxlc1wiLFxuICAgICAgICAgIFwiamF2YVwiLFxuICAgICAgICAgIFwicGRrLXBpcGVsaW5lLXNhbXBsZS1qYXZhXCIsXG4gICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICBcIm1haW5cIixcbiAgICAgICAgICBcImphdmFcIixcbiAgICAgICAgICBcInNvZnR3YXJlXCIsXG4gICAgICAgICAgXCJhd3NcIlxuICAgICAgICApLFxuICAgICAgfVxuICAgICk7XG4gICAgbmV3IFNhbXBsZURpcihcbiAgICAgIHRoaXMsXG4gICAgICBwYXRoLmpvaW4oXCJzcmNcIiwgXCJ0ZXN0XCIsIFwiamF2YVwiLCAuLi5tYWluUGFja2FnZS5zcGxpdChcIi5cIikpLFxuICAgICAge1xuICAgICAgICBzb3VyY2VEaXI6IHBhdGguam9pbihcbiAgICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICAgXCIuLlwiLFxuICAgICAgICAgIFwic2FtcGxlc1wiLFxuICAgICAgICAgIFwiamF2YVwiLFxuICAgICAgICAgIFwicGRrLXBpcGVsaW5lLXNhbXBsZS1qYXZhXCIsXG4gICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICBcInRlc3RcIixcbiAgICAgICAgICBcImphdmFcIixcbiAgICAgICAgICBcInNvZnR3YXJlXCIsXG4gICAgICAgICAgXCJhd3NcIlxuICAgICAgICApLFxuICAgICAgfVxuICAgICk7XG4gIH1cbn1cbiJdfQ==