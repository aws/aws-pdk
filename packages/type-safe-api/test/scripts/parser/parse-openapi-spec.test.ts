/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Parse OpenAPI Spec Script Unit Tests", () => {
  it("Bundles Spec Into Single File", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath = "../../resources/specs/multi.yaml";
        const outputPath = path.join(
          path.relative(path.resolve(__dirname), tmpDir),
          ".api.json"
        );
        const command = `../../../scripts/type-safe-api/parser/parse-openapi-spec --spec-path ${specPath} --output-path ${outputPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });

  it("Injects @handler and @paginated traits", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath =
          "../../resources/smithy/simple-pagination/openapi.json";
        const smithyJsonModelPath =
          "../../resources/smithy/simple-pagination/model.json";
        const outputPath = path.join(
          path.relative(path.resolve(__dirname), tmpDir),
          ".api.json"
        );
        const command = `../../../scripts/type-safe-api/parser/parse-openapi-spec --spec-path ${specPath} --output-path ${outputPath} --smithy-json-path ${smithyJsonModelPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });

  it("Maps renamed @paginated traits for query and header parameters", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath =
          "../../resources/smithy/rename-pagination/openapi.json";
        const smithyJsonModelPath =
          "../../resources/smithy/rename-pagination/model.json";
        const outputPath = path.join(
          path.relative(path.resolve(__dirname), tmpDir),
          ".api.json"
        );
        const command = `../../../scripts/type-safe-api/parser/parse-openapi-spec --spec-path ${specPath} --output-path ${outputPath} --smithy-json-path ${smithyJsonModelPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });

  it("Throws for unsupported request parameter types", () => {
    withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
      const specPath = "../../resources/specs/invalid-request-parameters.yaml";
      const outputPath = path.join(
        path.relative(path.resolve(__dirname), tmpDir),
        ".api.json"
      );
      const command = `../../../scripts/type-safe-api/parser/parse-openapi-spec --spec-path ${specPath} --output-path ${outputPath}`;
      expect(() => {
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      }).toThrow(
        /Request parameters must be of type number, integer, boolean, string or arrays of these. Found invalid parameters:\nget \/invalid\/parameters: objectQueryParam\nget \/invalid\/parameters: arrayOfObjects\nget \/invalid\/parameters: mixedTypes/
      );
    });
  });

  it("Permits parameter references (and circular references)", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath = "../../resources/specs/parameter-refs.yaml";
        const outputPath = path.join(
          path.relative(path.resolve(__dirname), tmpDir),
          ".api.json"
        );
        const command = `../../../scripts/type-safe-api/parser/parse-openapi-spec --spec-path ${specPath} --output-path ${outputPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });

  it("Injects @async, @connectHandler and @disconnectHandler traits", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath = "../../resources/smithy/async-recursive/openapi.json";
        const smithyJsonModelPath =
          "../../resources/smithy/async-recursive/model.json";
        const outputPath = path.join(
          path.relative(path.resolve(__dirname), tmpDir),
          ".api.json"
        );
        const command = `../../../scripts/type-safe-api/parser/parse-openapi-spec --spec-path ${specPath} --output-path ${outputPath} --smithy-json-path ${smithyJsonModelPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });
});
