/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
