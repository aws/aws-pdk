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
import * as fs from "fs";
import path from "path";
import { ClientLanguage, DocumentationFormat } from "../../../src";
import { OpenApiGatewayTsProject } from "../../../src/project/open-api-gateway-ts-project";

describe("OpenAPIGateway Ts Project - Regenerate Clients/Docs Tests", () => {
  // variables to reuse
  const generatedCodeDir = "generated";
  const defaultReleaseBranch = "mainline";
  const name = "@test/my-api";
  const testLanguage = ClientLanguage.TYPESCRIPT;
  const testDocFormat = DocumentationFormat.HTML2;

  // Note: we'll use "LMT" postfix for "LastModifiedTimestamp"

  // returns the last modified timestamp of a file from the generated client's folder
  const getClientFileLastModifiedTimestamp = (
    outdir: string,
    relFilePath: string
  ): number => {
    return fs
      .statSync(path.join(outdir, generatedCodeDir, testLanguage, relFilePath))
      .mtime.getTime();
  };
  // returns the last modified timestamp of a file from the generated doc's folder
  const getDocFileLastModifiedTimestamp = (
    outdir: string,
    relFilePath: string,
    docFormat?: DocumentationFormat
  ): number => {
    if (docFormat == null) {
      docFormat = testDocFormat;
    }
    return fs
      .statSync(
        path.join(
          outdir,
          generatedCodeDir,
          "documentation",
          docFormat,
          relFilePath
        )
      )
      .mtime.getTime();
  };

  it("No spec change -> don't regenerate clients/docs", () => {
    // create a project
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat],
    });
    project.synth();

    const { outdir } = project;
    const generatedFileLMT = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMT = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );

    // create another project with the same outdir
    const projectOther = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat],
      outdir,
    });
    projectOther.synth();

    const generatedFileLMTOther = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMTOther = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );

    // current `index.ts` should have the same modified time as the original project
    expect(generatedFileLMT).toEqual(generatedFileLMTOther);
    // current `index.html` in HTML2 docs should be untouched
    expect(generatedDocHTML2LMT).toEqual(generatedDocHTML2LMTOther);
  });

  it("forceGenerateCodeAndDocs=true will regenerate clients/docs", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat],
    });
    project.synth();

    const { outdir } = project;
    const generatedFileLMT = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMT = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );

    const projectOther = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat],
      outdir,
      forceGenerateCodeAndDocs: true,
    });
    projectOther.synth();

    const generatedFileLMTOther = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMTOther = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );

    // current `index.ts` should have later modified timestamp as the original project's
    expect(generatedFileLMT).toBeLessThan(generatedFileLMTOther);

    // current `index.html` in "html2" doc folder will be the same
    // because the generator uses "--minimal-update" switch:
    // the output only changes when spec changes, however, the generator runs
    expect(generatedDocHTML2LMT).toEqual(generatedDocHTML2LMTOther);
  });

  it("Change spec will regenerate clients/docs", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat],
    });
    project.synth();

    const { outdir, specDir, specFileName } = project;
    const generatedFileLMT = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMT = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );

    // change spec:
    const genSpecFilePath = path.join(outdir, "src", specDir, specFileName);
    const genSpecFileContent = fs.readFileSync(genSpecFilePath, {
      encoding: "utf-8",
    });
    fs.writeFileSync(
      genSpecFilePath,
      genSpecFileContent.replace("/hello:", "/hello-changed:"),
      { encoding: "utf-8" }
    );

    const projectOther = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat],
      outdir,
    });
    projectOther.synth();

    const generatedFileLMTOther = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMTOther = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );

    // current `index.ts` should have later modified timestamp as the original project's
    expect(generatedFileLMT).toBeLessThan(generatedFileLMTOther);
    // current `index.html` in "html2" doc folder should be updated
    expect(generatedDocHTML2LMT).toBeLessThan(generatedDocHTML2LMTOther);
  });

  it("Adding a new DocumentationFormat will not trigger regenerate for existing", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat],
    });
    project.synth();

    const { outdir } = project;

    // only "html2" doc folder was generated
    expect(
      fs.existsSync(
        path.join(outdir, generatedCodeDir, "documentation", testDocFormat)
      )
    ).toBeTruthy();
    expect(
      fs.existsSync(
        path.join(
          outdir,
          generatedCodeDir,
          "documentation",
          DocumentationFormat.MARKDOWN
        )
      )
    ).toBeFalsy();

    const generatedFileLMT = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMT = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );

    const projectOther = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [testLanguage],
      documentationFormats: [testDocFormat, DocumentationFormat.MARKDOWN],
      outdir,
    });
    projectOther.synth();

    // html2 doc folder still there
    expect(
      fs.existsSync(
        path.join(outdir, generatedCodeDir, "documentation", testDocFormat)
      )
    ).toBeTruthy();
    // markdown doc folder generated
    expect(
      fs.existsSync(
        path.join(
          outdir,
          generatedCodeDir,
          "documentation",
          DocumentationFormat.MARKDOWN
        )
      )
    ).toBeTruthy();

    const generatedFileLMTOther = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );
    const generatedDocHTML2LMTOther = getDocFileLastModifiedTimestamp(
      outdir,
      "index.html"
    );
    const generatedDocMDLMTOther = getDocFileLastModifiedTimestamp(
      outdir,
      "README.md",
      DocumentationFormat.MARKDOWN
    );

    // current `index.ts` should be untouched
    expect(generatedFileLMT).toEqual(generatedFileLMTOther);
    // current `index.html` in "html2" doc folder should be untouched
    expect(generatedDocHTML2LMT).toEqual(generatedDocHTML2LMTOther);
    // markdown docs were generated later than html2 docs
    expect(generatedDocHTML2LMT).toBeLessThan(generatedDocMDLMTOther);
  });

  it("Maintain References to Generated Client Projects without Regenerating", () => {
    // create a project
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [ClientLanguage.TYPESCRIPT, ClientLanguage.JAVA],
    });
    project.synth();

    expect(project.generatedClients[ClientLanguage.JAVA]).toBeDefined();
    expect(project.generatedClients[ClientLanguage.TYPESCRIPT]).toBeDefined();

    const { outdir } = project;
    const generatedFileLMT = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );

    // create another project with the same outdir
    const projectOther = new OpenApiGatewayTsProject({
      defaultReleaseBranch,
      name,
      generatedCodeDir,
      clientLanguages: [ClientLanguage.TYPESCRIPT, ClientLanguage.JAVA],
      outdir,
    });
    projectOther.synth();

    const generatedFileLMTOther = getClientFileLastModifiedTimestamp(
      outdir,
      "src/index.ts"
    );

    // current `index.ts` should have the same modified time as the original project
    expect(generatedFileLMT).toEqual(generatedFileLMTOther);

    // References to generated client projects should remain even if they weren't regenerated
    expect(projectOther.generatedClients[ClientLanguage.JAVA]).toBeDefined();
    expect(
      projectOther.generatedClients[ClientLanguage.TYPESCRIPT]
    ).toBeDefined();
  });
});
