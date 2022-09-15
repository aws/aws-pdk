/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
import { JsonFile } from "projen";
import { JavaProject, JavaProjectOptions } from "projen/lib/java";
import { GeneratedJavaClientSourceCode } from "./components/generated-java-client-source-code";
import { OpenApiGeneratorIgnoreFile } from "./components/open-api-generator-ignore-file";

/**
 * Configuration for the generated java client project
 */
export interface GeneratedJavaClientProjectOptions extends JavaProjectOptions {
  /**
   * The absolute path to the OpenAPI specification (spec.yaml) from which to generate code
   */
  readonly specPath: string;

  /**
   * Indicates whether the client generator needs to be invoked
   */
  readonly generateClient: boolean;
}

const DEPENDENCIES: string[] = [
  // Required for open api generated client
  "io.swagger/swagger-annotations@1.6.5",
  "com.google.code.findbugs/jsr305@3.0.2",
  "com.squareup.okhttp3/okhttp@4.9.3",
  "com.squareup.okhttp3/logging-interceptor@4.9.3",
  "com.google.code.gson/gson@2.9.0",
  "io.gsonfire/gson-fire@1.8.5",
  "org.apache.commons/commons-lang3@3.12.0",
  "jakarta.annotation/jakarta.annotation-api@1.3.5",
  "org.openapitools/jackson-databind-nullable@0.2.2",
  "javax.ws.rs/jsr311-api@1.1.1",
  "javax.ws.rs/javax.ws.rs-api@2.1.1",
  // For handler wrappers
  "com.amazonaws/aws-lambda-java-core@1.2.1",
  "com.amazonaws/aws-lambda-java-events@3.11.0",
  // Lombok is used to add the builder pattern to models for neater construction
  "org.projectlombok/lombok@1.18.24",
];

const TEST_DEPENDENCIES: string[] = [
  "org.junit.jupiter/junit-jupiter-api@5.8.2",
  "org.mockito/mockito-core@3.12.4",
];

/**
 * Java project containing a java client (and lambda handler wrappers) generated using OpenAPI Generator CLI
 */
export class GeneratedJavaClientProject extends JavaProject {
  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: GeneratedJavaClientProjectOptions) {
    super({
      sample: false,
      junit: false,
      ...options,
    });

    // Ignore files that we will control via projen
    const ignoreFile = new OpenApiGeneratorIgnoreFile(this);
    ignoreFile.addPatterns("pom.xml");

    // Add dependencies
    DEPENDENCIES.forEach((dep) => this.addDependency(dep));
    TEST_DEPENDENCIES.forEach((dep) => this.addTestDependency(dep));

    // Use a package.json to ensure the client is discoverable by nx
    new JsonFile(this, "package.json", {
      obj: {
        name: this.name,
        __pdk__: true,
        version: options.version,
        scripts: Object.fromEntries(
          this.tasks.all.map((task) => [task.name, `npx projen ${task.name}`])
        ),
      },
      readonly: true,
    });

    new GeneratedJavaClientSourceCode(this, {
      specPath: options.specPath,
      invokeGenerator: options.generateClient,
    });
  }

  /**
   * @inheritDoc
   */
  synth() {
    // Save some time by only synthesizing once. We synthesize this project early so that it's available for the parent
    // project's install phase (pre-synth). Projen will call this method again at the usual time to synthesize this,
    // project, at which point we're already done so can skip.
    if (this.synthed) {
      return;
    }
    super.synth();
    this.synthed = true;
  }
}
