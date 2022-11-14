/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { OpenAPIV3 } from "openapi-types";
import {
  GenerationOptions,
  invokeOpenApiGenerator,
  NonClientGeneratorDirectory,
} from "../../../../src/project/codegen/components/utils";

const withTmpDir = (fn: (tmpDir: string) => void) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "invoke-generator-test"));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

/**
 * Invoke the generator with the given spec and return the output path
 */
const generate = (
  spec: OpenAPIV3.Document,
  dir: string,
  options: Pick<GenerationOptions, "generator" | "generatorDirectory">
): string => {
  const specDir = path.join(dir, "spec");
  const outputPath = path.join(dir, "output");
  fs.mkdirSync(specDir, { recursive: true });
  fs.mkdirSync(outputPath, { recursive: true });

  const specPath = path.join(specDir, "spec.json");

  fs.writeFileSync(specPath, JSON.stringify(spec));

  invokeOpenApiGenerator({
    ...options,
    outputPath,
    specPath,
  });

  return outputPath;
};

const defaultSpec: OpenAPIV3.Document = {
  info: {
    title: "Test",
    version: "1.0.0",
  },
  openapi: "3.0.1",
  paths: {
    "/test": {
      get: {
        operationId: "testOperation",
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      MyModel: {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
        },
      },
    },
  },
};

describe("Invoke Generator Unit Tests", () => {
  it("Clean Up Previously Generated Files", () => {
    withTmpDir((dir) => {
      // Generate once with a spec with a single model
      const outdir = generate(defaultSpec, dir, {
        generator: "markdown",
        generatorDirectory: NonClientGeneratorDirectory.DOCS,
      });
      expect(
        fs.existsSync(path.join(outdir, "Models", "MyModel.md"))
      ).toBeTruthy();

      // Generate again in the same directory, with an updated schema
      generate(
        {
          ...defaultSpec,
          components: {
            schemas: {
              MyNewModel: {
                type: "object",
                properties: {
                  anotherProperty: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        dir,
        {
          generator: "markdown",
          generatorDirectory: NonClientGeneratorDirectory.DOCS,
        }
      );

      // New model should exist, and old model should be cleaned up
      expect(
        fs.existsSync(path.join(outdir, "Models", "MyNewModel.md"))
      ).toBeTruthy();
      expect(
        fs.existsSync(path.join(outdir, "Models", "MyModel.md"))
      ).toBeFalsy();
    });
  });
});
