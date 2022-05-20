"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipelineJavaProject = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLWphdmEtcHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBkay1waXBlbGluZS1qYXZhLXByb2plY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFFQUFxRTtBQUNyRSxzQ0FBc0M7OztBQUV0Qyw2QkFBNkI7QUFDN0IsbUNBQW1DO0FBQ25DLDhDQUF3RTtBQU94RTs7OztHQUlHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSxzQkFBYTtJQUN2RCxZQUFZLE9BQXNDO1FBQ2hELEtBQUssQ0FBQztZQUNKLE1BQU0sRUFBRSxLQUFLO1lBQ2IsS0FBSyxFQUFFLEtBQUs7WUFDWixHQUFHLE9BQU87WUFDVixTQUFTLEVBQ1AsT0FBTyxDQUFDLFNBQVMsS0FBSyxnQkFBZ0I7Z0JBQ3BDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUztnQkFDbkIsQ0FBQyxDQUFDLG9EQUFvRDtTQUMzRCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxDQUFDLCtDQUErQyxDQUFDLENBQUM7UUFFcEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLDhDQUE4QyxDQUFDLENBQUM7UUFFdkUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVM7YUFDL0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNiLEtBQUssQ0FBQyxHQUFHLENBQUM7YUFDVixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ1osSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsSUFBSSxrQkFBUyxDQUNYLElBQUksRUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUMzRDtZQUNFLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUNsQixTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxNQUFNLEVBQ04sMEJBQTBCLEVBQzFCLEtBQUssRUFDTCxNQUFNLEVBQ04sTUFBTSxFQUNOLFVBQVUsRUFDVixLQUFLLENBQ047U0FDRixDQUNGLENBQUM7UUFDRixJQUFJLGtCQUFTLENBQ1gsSUFBSSxFQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzNEO1lBQ0UsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQ2xCLFNBQVMsRUFDVCxJQUFJLEVBQ0osU0FBUyxFQUNULE1BQU0sRUFDTiwwQkFBMEIsRUFDMUIsS0FBSyxFQUNMLE1BQU0sRUFDTixNQUFNLEVBQ04sVUFBVSxFQUNWLEtBQUssQ0FDTjtTQUNGLENBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTVERCx3REE0REMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IFNhbXBsZURpciB9IGZyb20gXCJwcm9qZW5cIjtcbmltcG9ydCB7IEF3c0Nka0phdmFBcHAsIEF3c0Nka0phdmFBcHBPcHRpb25zIH0gZnJvbSBcInByb2plbi9saWIvYXdzY2RrXCI7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgUERLUGlwZWxpbmVKYXZhUHJvamVjdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQREtQaXBlbGluZUphdmFQcm9qZWN0T3B0aW9ucyBleHRlbmRzIEF3c0Nka0phdmFBcHBPcHRpb25zIHt9XG5cbi8qKlxuICogU3ludGhlc2l6ZXMgYSBKYXZhIFByb2plY3Qgd2l0aCBhIENJL0NEIHBpcGVsaW5lLlxuICpcbiAqIEBwamlkIHBkay1waXBlbGluZS1qYXZhXG4gKi9cbmV4cG9ydCBjbGFzcyBQREtQaXBlbGluZUphdmFQcm9qZWN0IGV4dGVuZHMgQXdzQ2RrSmF2YUFwcCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFBES1BpcGVsaW5lSmF2YVByb2plY3RPcHRpb25zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgc2FtcGxlOiBmYWxzZSxcbiAgICAgIGp1bml0OiBmYWxzZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBtYWluQ2xhc3M6XG4gICAgICAgIG9wdGlvbnMubWFpbkNsYXNzICE9PSBcIm9yZy5hY21lLk15QXBwXCJcbiAgICAgICAgICA/IG9wdGlvbnMubWFpbkNsYXNzXG4gICAgICAgICAgOiAnc29mdHdhcmUuYXdzLlBpcGVsaW5lIC1EZXhlYy5jbGFzc3BhdGhTY29wZT1cInRlc3RcIicsXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZERlcGVuZGVuY3koXCJzb2Z0d2FyZS5hd3MuYXdzcHJvdG90eXBpbmdzZGsvYXdzLXBkay1saWJAXjBcIik7XG5cbiAgICB0aGlzLnRlc3RUYXNrLmV4ZWMoXCJtdm4gdGVzdFwiKTtcbiAgICB0aGlzLmFkZFRlc3REZXBlbmRlbmN5KFwib3JnLmp1bml0Lmp1cGl0ZXIvanVuaXQtanVwaXRlci1hcGlANS43LjBcIik7XG4gICAgdGhpcy5hZGRUZXN0RGVwZW5kZW5jeShcIm9yZy5qdW5pdC5qdXBpdGVyL2p1bml0LWp1cGl0ZXItZW5naW5lQDUuNy4wXCIpO1xuXG4gICAgY29uc3QgbWFpblBhY2thZ2UgPSB0aGlzLm1haW5DbGFzc1xuICAgICAgLnNwbGl0KFwiIFwiKVswXVxuICAgICAgLnNwbGl0KFwiLlwiKVxuICAgICAgLnNsaWNlKDAsIC0xKVxuICAgICAgLmpvaW4oXCIuXCIpO1xuICAgIG5ldyBTYW1wbGVEaXIoXG4gICAgICB0aGlzLFxuICAgICAgcGF0aC5qb2luKFwic3JjXCIsIFwibWFpblwiLCBcImphdmFcIiwgLi4ubWFpblBhY2thZ2Uuc3BsaXQoXCIuXCIpKSxcbiAgICAgIHtcbiAgICAgICAgc291cmNlRGlyOiBwYXRoLmpvaW4oXG4gICAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAgIFwiLi5cIixcbiAgICAgICAgICBcInNhbXBsZXNcIixcbiAgICAgICAgICBcImphdmFcIixcbiAgICAgICAgICBcInBkay1waXBlbGluZS1zYW1wbGUtamF2YVwiLFxuICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgXCJtYWluXCIsXG4gICAgICAgICAgXCJqYXZhXCIsXG4gICAgICAgICAgXCJzb2Z0d2FyZVwiLFxuICAgICAgICAgIFwiYXdzXCJcbiAgICAgICAgKSxcbiAgICAgIH1cbiAgICApO1xuICAgIG5ldyBTYW1wbGVEaXIoXG4gICAgICB0aGlzLFxuICAgICAgcGF0aC5qb2luKFwic3JjXCIsIFwidGVzdFwiLCBcImphdmFcIiwgLi4ubWFpblBhY2thZ2Uuc3BsaXQoXCIuXCIpKSxcbiAgICAgIHtcbiAgICAgICAgc291cmNlRGlyOiBwYXRoLmpvaW4oXG4gICAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAgIFwiLi5cIixcbiAgICAgICAgICBcInNhbXBsZXNcIixcbiAgICAgICAgICBcImphdmFcIixcbiAgICAgICAgICBcInBkay1waXBlbGluZS1zYW1wbGUtamF2YVwiLFxuICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgXCJ0ZXN0XCIsXG4gICAgICAgICAgXCJqYXZhXCIsXG4gICAgICAgICAgXCJzb2Z0d2FyZVwiLFxuICAgICAgICAgIFwiYXdzXCJcbiAgICAgICAgKSxcbiAgICAgIH1cbiAgICApO1xuICB9XG59XG4iXX0=