/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { writeFile } from "projen/lib/util";
import { ConstructGenerationArguments } from "../types";

export const generatePythonTypeSafeCdkConstruct = (
  options: ConstructGenerationArguments
) => {
  writeFile(path.join(options.sourcePath, "__init__.py"), `#`, {
    readonly: true,
  });
  writeFile(
    path.join(options.sourcePath, "api.py"),
    `from dataclasses import fields
from aws_prototyping_sdk.type_safe_api import TypeSafeRestApi, TypeSafeApiIntegration
from ${options.generatedTypesPackage}.apis.tags.default_api_operation_config import OperationLookup, OperationConfig
from os import path
from pathlib import Path

SPEC_PATH = path.join(str(Path(__file__).absolute().parent), "${options.relativeSpecPath}")

class Api(TypeSafeRestApi):
    """
    Type-safe construct for the API Gateway resources defined by your model.
    This construct is generated and should not be modified.
    """
    def __init__(self, scope, id, integrations: OperationConfig[TypeSafeApiIntegration], **kwargs):
        super().__init__(scope, id,
            **kwargs,
            integrations={ field.name: getattr(integrations, field.name) for field in fields(integrations) },
            spec_path=SPEC_PATH,
            operation_lookup=OperationLookup,
        )
`,
    { readonly: true }
  );
};
