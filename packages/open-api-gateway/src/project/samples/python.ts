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

/**
 * Options for python sample code generation
 */
export interface PythonSampleCodeOptions {
  /**
   * The package name which exports the OpenApiGatewayRestApi construct (ie this pdk package!)
   */
  readonly openApiGatewayPackageName: string;
  /**
   * The name of the generated python client package
   */
  readonly pythonClientPackageName: string;
  /**
   * Whether or not to generate sample code
   */
  readonly sampleCode?: boolean;
  /**
   * Directory where the parsed spec is output
   */
  readonly specDir: string;
  /**
   * Name of the parsed spec file
   */
  readonly parsedSpecFileName: string;
  /**
   * Name of the module
   */
  readonly moduleName: string;
}

/**
 * Return a map of file name to contents for the sample python source code
 */
export const getPythonSampleSource = (
  options: PythonSampleCodeOptions
): { [fileName: string]: string } => ({
  "__init__.py": "#",
  // This file provides a type-safe interface to the exported OpenApiGatewayRestApi construct
  "api.py": `from dataclasses import fields
from ${options.openApiGatewayPackageName} import OpenApiGatewayRestApi, OpenApiIntegration
from ${options.pythonClientPackageName}.apis.tags.default_api_operation_config import OperationLookup, OperationConfig
from ${options.moduleName}.spec_utils import SPEC, SPEC_PATH

class Api(OpenApiGatewayRestApi):
    """
    Type-safe construct for the API Gateway resources defined by the spec.
    You will likely not need to modify this file, and can instead extend it and define your integrations.
    """
    def __init__(self, scope, id, integrations: OperationConfig[OpenApiIntegration], **kwargs):
        super().__init__(scope, id,
            **kwargs,
            integrations={ field.name: getattr(integrations, field.name) for field in fields(integrations) },
            spec=SPEC,
            spec_path=SPEC_PATH,
            operation_lookup=OperationLookup,
        )
`,
  ...(options.sampleCode !== false
    ? {
        // Generate an example which instantiates the Api construct
        // TODO: Consider generating this sample from the parsed spec
        "sample_api.py": `from ${options.openApiGatewayPackageName} import Authorizers, Integrations, OpenApiIntegration
from ${options.pythonClientPackageName}.apis.tags.default_api_operation_config import OperationConfig
from aws_cdk.aws_lambda import LayerVersion, Code, Function, Runtime
from .api import Api
from constructs import Construct
from ${options.moduleName}.spec_utils import get_generated_client_layer_directory
from pathlib import Path
from os import path

class SampleApi(Construct):
  """
  An example of how to add integrations to your api
  """
  def __init__(self, scope, id):
      super().__init__(scope, id)

      # Layer which contains the generated client.
      self.generated_client_layer = LayerVersion(self, 'GeneratedClientLayer',
          code=Code.from_asset(get_generated_client_layer_directory())
      )

      self.api = Api(self, 'Api',
          default_authorizer=Authorizers.iam(),
          integrations=OperationConfig(
              say_hello=OpenApiIntegration(
                  integration=Integrations.lambda(Function(self, 'SayHello',
                      runtime=Runtime.PYTHON_3_9,
                      code=Code.from_asset(path.join(str(Path(__file__).parent.absolute()), 'handlers')),
                      handler="say_hello_handler_sample.handler",
                      layers=[self.generated_client_layer],
                  )),
              ),
          ),
      )
`,
        // Generate an example lambda handler
        "handlers/say_hello_handler_sample.py": `from ${options.pythonClientPackageName}.apis.tags.default_api_operation_config import say_hello_handler, SayHelloRequest, ApiResponse, SayHelloOperationResponses
from ${options.pythonClientPackageName}.model.hello_response import SayHelloResponseContent

@say_hello_handler
def handler(input: SayHelloRequest, **kwargs) -> SayHelloOperationResponses:
    """
    An example lambda handler which uses the generated handler wrapper to manage marshalling inputs/outputs
    """
    return ApiResponse(
        status_code=200,
        body=SayHelloResponseContent(message="Hello {}!".format(input.request_parameters["name"])),
        headers={}
    )
`,
      }
    : {}),
});
