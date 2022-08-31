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
import * as fs from "fs-extra";
import { Project } from "projen";
import { directorySnapshot } from "projen/lib/util/synth";
import { ClientSettings } from "../../../../src/project/codegen/components/client-settings";
import {
  ClientLanguage,
  DocumentationFormat,
} from "../../../../src/project/languages";

const synthClientSettings = (
  project: Project,
  clientSettingsFilename?: string
) => {
  try {
    new ClientSettings(project, {
      clientSettingsFilename,
      generatedCodeDir: "generated",
      clientLanguages: [ClientLanguage.TYPESCRIPT],
      defaultClientLanguage: ClientLanguage.TYPESCRIPT,
      documentationFormats: [DocumentationFormat.HTML2],
      specChanged: false,
      forceGenerateCodeAndDocs: false,
    });
    project.synth();
    return directorySnapshot(project.outdir);
  } finally {
    fs.removeSync(project.outdir);
  }
};

describe("Client Settings Unit Tests", () => {
  it("Default client-settings file gets generated", () => {
    const project = new Project({
      name: "test",
    });
    expect(synthClientSettings(project)).toMatchSnapshot();
  });

  it("Custom-name client-settings file gets generated", () => {
    const project = new Project({
      name: "test",
    });
    expect(
      synthClientSettings(project, "custom-client-settings.json")
    ).toMatchSnapshot();
  });
});
