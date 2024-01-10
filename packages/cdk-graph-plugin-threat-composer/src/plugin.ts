/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import {
  CdkGraph,
  CdkGraphArtifact,
  CdkGraphContext,
  ICdkGraphPlugin,
  IGraphPluginBindCallback,
  IGraphReportCallback,
} from "@aws/cdk-graph";
import { PDKNagApp } from "@aws/pdk-nag";
import { ThreatModelGenerator } from "./model-generator/threat-model-generator";
import { ThreatComposerApplicationDetails } from "./model-generator/types";

/**
 * Options for the Threat Composer CDK Graph plugin
 */
export interface CdkGraphThreatComposerPluginOptions {
  /**
   * Details about the application to include in the threat model
   */
  readonly applicationDetails?: ThreatComposerApplicationDetails;
}

/**
 * CdkGraphThreatComposerPlugin is a {@link ICdkGraphPlugin CdkGraph Plugin} implementation for generating
 * Threat Composer threat models.
 * @see https://github.com/awslabs/threat-composer
 */
export class CdkGraphThreatComposerPlugin implements ICdkGraphPlugin {
  /**
   * Fixed ID of the threat-composer plugin
   */
  static readonly ID = "threat-composer";

  /**
   * Curent semantic version of the threat-composer plugin
   */
  static readonly VERSION = "0.0.0";

  /** @inheritdoc */
  get id(): string {
    return CdkGraphThreatComposerPlugin.ID;
  }

  /** @inheritdoc */
  get version(): string {
    return CdkGraphThreatComposerPlugin.VERSION;
  }

  /**
   * Retrieve the threat model artifact
   */
  get threatModelArtifact(): CdkGraphArtifact | undefined {
    return this._threatModelArtifact;
  }

  // TODO: consider graph plugin as dependency?
  /** @inheritdoc */
  readonly dependencies?: string[] = [];

  /** @internal */
  private _app?: PDKNagApp;

  /** @internal */
  private _options?: CdkGraphThreatComposerPluginOptions;

  /** @internal */
  private _threatModelArtifact: CdkGraphArtifact | undefined = undefined;

  constructor(options?: CdkGraphThreatComposerPluginOptions) {
    this._options = options;
  }

  /** @inheritdoc */
  bind: IGraphPluginBindCallback = (graph: CdkGraph): void => {
    // Validate the top level node is a PDKNagApp, providing us with access to nag results
    if (!("extendedNagResults" in graph.root)) {
      throw new Error(
        `Threat Composer plugin requires the root CDK construct to be a PDKNagApp`
      );
    }
    this._app = graph.root as PDKNagApp;
  };

  /** @inheritdoc */
  report?: IGraphReportCallback = async (
    context: CdkGraphContext
  ): Promise<void> => {
    if (!this._app) {
      throw new Error("Plugin has not been bound");
    }

    let architectureImageDataUri: string | undefined = undefined;

    const architectureDiagramArtifact: CdkGraphArtifact | undefined =
      context.artifacts.DIAGRAM_PNG;
    if (architectureDiagramArtifact) {
      const diagramBinaryContent = fs.readFileSync(
        architectureDiagramArtifact.filepath
      );
      architectureImageDataUri = `data:image/png;base64,${diagramBinaryContent.toString(
        "base64"
      )}`;
    }

    const threatModel = new ThreatModelGenerator().generate(
      this._app.extendedNagResults(),
      {
        ...this._options,
        architectureImageDataUri,
      }
    );

    this._threatModelArtifact = context.writeArtifact(
      this,
      "THREAT_MODEL",
      "threat-model.tc.json",
      JSON.stringify(threatModel, null, 2),
      "Threat Composer threat model."
    );
  };
}
