/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, FileBase, IResolver } from "projen";
import { Language } from "../../../languages";

/**
 * Options for the aws-pdk/prelude.smithy file
 */
export interface SmithyAwsPdkPreludeOptions {
  /**
   * Path to the generated model directory in which to add the prelude
   */
  readonly generatedModelDir: string;
  /**
   * Namespace for the smithy service
   */
  readonly serviceNamespace: string;
  /**
   * Languages selected for handlers
   */
  readonly handlerLanguages?: Language[];
}

/**
 * Synthesize the aws-pdk/prelude.smithy file
 */
export class SmithyAwsPdkPrelude extends FileBase {
  private readonly options: SmithyAwsPdkPreludeOptions;

  constructor(project: Project, options: SmithyAwsPdkPreludeOptions) {
    super(
      project,
      path.join(options.generatedModelDir, "aws-pdk", "prelude.smithy"),
      {
        marker: true,
        readonly: true,
      }
    );
    this.options = options;
  }

  public synthesizeContent(_: IResolver): string | undefined {
    const hasAnyHandlerProjects =
      (this.options.handlerLanguages ?? []).length > 0;

    const traitValidator = hasAnyHandlerProjects
      ? `{
        id: "ConfiguredHandlerProject"
        name: "EmitEachSelector"
        configuration: {
            bindToTrait: ${this.options.serviceNamespace}#handler
            selector: """
                [@trait|${
                  this.options.serviceNamespace
                }#handler: @{language} = typescript, java, python]
                :not([@trait|${
                  this.options.serviceNamespace
                }#handler: @{language} = ${this.options.handlerLanguages?.join(
          ", "
        )}])
            """
            messageTemplate: """
                @@handler language @{trait|${
                  this.options.serviceNamespace
                }#handler|language} cannot be referenced unless a handler project is configured for this language.
                Configured handler project languages are: ${this.options.handlerLanguages?.join(
                  ", "
                )}.
                You can add this language by configuring TypeSafeApiProject in your .projenrc
            """
        }
    }`
      : `{
        id: "TraitNotPermitted"
        name: "EmitEachSelector"
        configuration: {
            bindToTrait: ${this.options.serviceNamespace}#handler
            selector: """
                *
            """
            messageTemplate: """
                @@handler trait cannot be used unless handler project languages have been configured.
                You can add handler projects by configuring TypeSafeApiProject in your .projenrc
            """
        }
    }`;

    return `// ${this.marker}

$version: "2"

metadata validators = [
    {
        id: "SupportedLanguage"
        name: "EmitEachSelector"
        configuration: {
            bindToTrait: ${this.options.serviceNamespace}#handler
            selector: """
                :not([@trait|${
                  this.options.serviceNamespace
                }#handler: @{language} = typescript, java, python])
            """
            messageTemplate: """
                @{trait|${
                  this.options.serviceNamespace
                }#handler|language} is not supported by type-safe-api.
                Supported languages are "typescript", "java" and "python".
            """
        }
    }
    ${traitValidator}
]

namespace ${this.options.serviceNamespace}

/// Add this trait to an operation to generate a lambda handler stub for the operation.
/// ${
      hasAnyHandlerProjects
        ? `You have configured handler projects for ${this.options.handlerLanguages?.join(
            ", "
          )}`
        : "You have not configured any handler projects, so you cannot use this trait."
    }
@trait(selector: "operation")
structure handler {
    /// The language you will implement the lambda in.
    /// Valid values: typescript, java, python
    @required
    language: String
}

`;
  }
}
