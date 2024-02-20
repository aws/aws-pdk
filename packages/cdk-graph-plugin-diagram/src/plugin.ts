/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  CdkGraph,
  CdkGraphArtifact,
  CdkGraphContext,
  ICdkGraphPlugin,
  IGraphPluginBindCallback,
  IGraphReportCallback,
  performGraphFilterPlan,
} from "@aws/cdk-graph";
import * as fs from "fs-extra";
import { toStream } from "ts-graphviz/adapter";
import {
  CONFIG_DEFAULTS,
  DEFAULT_DIAGRAM,
  DEFAULT_DIAGRAM_NAME,
  DiagramFormat,
  IDiagramConfig,
  IPluginConfig,
} from "./config";
import { IS_DEBUG } from "./internal/debug";
import { buildDiagram } from "./internal/graphviz/diagram";
import { resolveSvgAwsArchAssetImagesInline } from "./internal/utils/svg";

/**
 * CdkGraphDiagramPlugin is a {@link ICdkGraphPlugin CdkGraph Plugin} implementation for generating
 * diagram artifacts from the {@link CdkGraph} framework.
 */
export class CdkGraphDiagramPlugin implements ICdkGraphPlugin {
  /** Namespace for artifacts of the diagram plugin */
  static readonly ARTIFACT_NS = "DIAGRAM";
  /** Fixed id of the diagram plugin */
  static readonly ID = "diagram";
  /** Current semantic version of the diagram plugin */
  static readonly VERSION = "0.0.0";

  /** Get standardized artifact id for diagram artifacts */
  static artifactId(name: string, format: DiagramFormat): string {
    if (name === DEFAULT_DIAGRAM_NAME) {
      return `${this.ARTIFACT_NS}_${format.toUpperCase()}`;
    }
    return `${this.ARTIFACT_NS}_${name.toUpperCase()}_${format.toUpperCase()}`;
  }
  /** Get standardized artifact file name for diagram artifacts */
  static artifactFilename(name: string, format: DiagramFormat): string {
    if (name === DEFAULT_DIAGRAM_NAME) {
      return `${this.ARTIFACT_NS.toLowerCase()}.${format}`;
    }
    return `${this.ARTIFACT_NS.toLowerCase()}.${name}.${format}`;
  }

  /** @inheritdoc */
  get id(): string {
    return CdkGraphDiagramPlugin.ID;
  }
  /** @inheritdoc */
  get version(): string {
    return CdkGraphDiagramPlugin.VERSION;
  }

  /** @inheritdoc */
  readonly dependencies?: string[] = [];

  /** @internal */
  private _graph?: CdkGraph;

  /** @internal */
  private _config?: IPluginConfig;

  /** Get default dot artifact */
  get defaultDotArtifact(): CdkGraphArtifact | undefined {
    try {
      return this.getDiagramArtifact(DEFAULT_DIAGRAM_NAME, DiagramFormat.DOT);
    } catch {
      return;
    }
  }

  /** Get default PNG artifact */
  get defaultPngArtifact(): CdkGraphArtifact | undefined {
    try {
      return this.getDiagramArtifact(DEFAULT_DIAGRAM_NAME, DiagramFormat.PNG);
    } catch {
      return;
    }
  }

  /** Get diagram plugin config */
  get config(): IPluginConfig {
    if (this._config != null) {
      return this._config;
    }
    throw new Error(
      "Plugin config has not been instantiated, ensure bind is called"
    );
  }

  constructor(config?: IPluginConfig) {
    this._config = config;
  }

  /** Get diagram artifact for a given name and format */
  getDiagramArtifact(
    name: string,
    format: DiagramFormat
  ): CdkGraphArtifact | undefined {
    return this._graph?.graphContext?.getArtifact(
      CdkGraphDiagramPlugin.artifactId(name, format)
    );
  }

  /** @inheritdoc */
  bind: IGraphPluginBindCallback = (graph: CdkGraph): void => {
    this._graph = graph;
    const rc = (graph.config[CdkGraphDiagramPlugin.ID] ||
      {}) as Partial<IPluginConfig>;
    let diagrams: IDiagramConfig[] = [
      ...(rc.diagrams || []),
      ...(this._config?.diagrams || []),
    ];
    if (diagrams.length === 0) {
      diagrams = [DEFAULT_DIAGRAM];
    }
    this._config = {
      defaults: {
        ...CONFIG_DEFAULTS,
        ...rc.defaults,
        ...this._config?.defaults,
      },
      diagrams,
    };
  };

  private streamToBuffer = (stream: NodeJS.ReadableStream): Promise<Buffer> => {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  };

  /** @inheritdoc */
  report?: IGraphReportCallback = async (
    context: CdkGraphContext
  ): Promise<void> => {
    const pluginConfig = this.config as Required<IPluginConfig>;

    for (const diagramConfig of pluginConfig.diagrams) {
      const config: IDiagramConfig = {
        ...(diagramConfig.ignoreDefaults ? {} : pluginConfig.defaults),
        ...diagramConfig,
      };

      let formats: DiagramFormat[] = Array.isArray(config.format)
        ? config.format
        : [config.format || DiagramFormat.PNG];
      if (!formats.length) {
        throw new Error(
          `Diagram config specifies empty list of formats; must provide at least 1 or undefined to use default.`
        );
      }

      // each diagram is destructive, so we need a clone
      const store = context.store.clone();

      if (config.filterPlan) {
        performGraphFilterPlan(store, config.filterPlan);
      }

      const generatePng = formats.includes(DiagramFormat.PNG);
      const generateSvg = generatePng || formats.includes(DiagramFormat.SVG);
      const generateDot = generateSvg || formats.includes(DiagramFormat.DOT);

      IS_DEBUG &&
        context.writeArtifact(
          this,
          "filtered.graph." + config.name + "",
          "debug/filtered-graph/" + config.name + ".json",
          JSON.stringify(store.serialize(), null, 2),
          "DEBUG"
        );

      const diagram = buildDiagram(store, {
        title: config.title,
        preset: config.filterPlan?.preset,
        theme: config.theme,
      });

      const dot = diagram.toDot();

      if (generateDot) {
        // Graphviz provider
        context.writeArtifact(
          this,
          CdkGraphDiagramPlugin.artifactId(config.name, DiagramFormat.DOT),
          CdkGraphDiagramPlugin.artifactFilename(
            config.name,
            DiagramFormat.DOT
          ),
          dot,
          `Diagram generated "dot" file for ${config.name} - "${config.title}"`
        );

        if (generateSvg) {
          const svgFile = path.join(
            context.outdir,
            CdkGraphDiagramPlugin.artifactFilename(
              config.name,
              DiagramFormat.SVG
            )
          );

          const svg = await this.streamToBuffer(
            await toStream(dot, { format: "svg" })
          );
          const resolvedSvg = await resolveSvgAwsArchAssetImagesInline(
            svg.toString()
          );

          fs.ensureDirSync(path.dirname(svgFile));
          fs.writeFileSync(svgFile, resolvedSvg);

          context.logArtifact(
            this,
            CdkGraphDiagramPlugin.artifactId(config.name, DiagramFormat.SVG),
            svgFile,
            `Diagram generated "svg" file for ${config.name} - "${config.title}"`
          );

          if (generatePng) {
            const pngFile = path.join(
              context.outdir,
              CdkGraphDiagramPlugin.artifactFilename(
                config.name,
                DiagramFormat.PNG
              )
            );

            try {
              const png = await this.streamToBuffer(
                await toStream(dot, {
                  format: "png",
                })
              );

              fs.ensureDirSync(path.dirname(pngFile));
              fs.writeFileSync(pngFile, png);

              context.logArtifact(
                this,
                CdkGraphDiagramPlugin.artifactId(
                  config.name,
                  DiagramFormat.PNG
                ),
                pngFile,
                `Diagram generated "png" file for ${config.name} - "${config.title}"`
              );
            } catch (error) {
              console.error(error);
              throw new Error(
                `Failed to generate PNG diagram for ${
                  config.name
                } at "${pngFile}" - ${String(error)}`
              );
            }
          }
        }
      }

      // NB: add drawio provider support here
    }
  };
}
