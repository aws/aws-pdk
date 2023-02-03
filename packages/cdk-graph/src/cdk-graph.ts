/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Aspects, ISynthesisSession } from "aws-cdk-lib";
import chalk = require("chalk"); // eslint-disable-line @typescript-eslint/no-require-imports
import { Construct, IConstruct } from "constructs";
import * as fs from "fs-extra";
import { addCustomSynthesis } from "./cdk-internals";
import { CdkGraphConfig, resolveConfig, resolveOutdir } from "./config";
import { computeGraph, Graph, Version, GRAPH_ID } from "./core";

const GRAPH_ARTIFACT_ID = "GRAPH";

/** CdkGraph core artifacts */
export enum CdkGraphArtifacts {
  GRAPH_METADATA = "graph-metadata.json",
  GRAPH = "graph.json",
}

/**
 * CdkGraph artifact definition
 * @struct
 */
export interface CdkGraphArtifact {
  /** The unique type of the artifact */
  readonly id: string;
  /** Filename of the artifact */
  readonly filename: string;
  /** Full path where artifact is stored */
  readonly filepath: string;
  /** Description of artifact */
  readonly description?: string;
  /** The source of the artifact (such as plugin, or core system, etc) */
  readonly source: string;
}

/** Dictionary of graph artifacts by id */
export type CdkGraphArtifactDict = { [id: string]: CdkGraphArtifact };

/** CdkGraph context */
export class CdkGraphContext {
  /** @internal */
  readonly _artifacts: CdkGraphArtifactDict = {};

  constructor(
    public readonly store: Graph.Store,
    public readonly outdir: string
  ) {}

  /**
   * Get CdkGraph artifact by id
   * @throws Error is artifact does not exist
   */
  getArtifact(id: string): CdkGraphArtifact {
    const artifact = this._artifacts[id];
    if (artifact) {
      return artifact;
    }
    throw new Error(`Graph artifact ${id} does not exist`);
  }

  /** Get CdkGraph core `graph.json` artifact */
  get graphJson(): CdkGraphArtifact {
    return this.getArtifact(GRAPH_ARTIFACT_ID);
  }

  /** Indicates if context has an artifact with *filename* defined */
  hasArtifactFile(filename: string): boolean {
    return !!Object.values(this._artifacts).find(
      (artifact) => artifact.filename === filename
    );
  }

  /** Get record of all graph artifacts keyed by artifact id */
  get artifacts(): CdkGraphArtifactDict {
    return this._artifacts;
  }

  /**
   * Logs an artifact entry. In general this should not be called directly, as `writeArtifact` should be utilized
   * to perform writing and logging artifacts. However some plugins utilize other tools that generate the artifacts,
   * in which case the plugin would call this method to log the entry.
   * @param source The source of the artifact, such as the name of plugin
   * @param id Unique id of the artifact
   * @param filepath Full path where the artifact is stored
   * @param description Description of the artifact
   * @returns
   * @throws Error is artifact id or filename already exists
   */
  logArtifact(
    source: CdkGraph | ICdkGraphPlugin,
    id: string,
    filepath: string,
    description?: string
  ): CdkGraphArtifact {
    if (id in this._artifacts) {
      throw new Error(`Graph artifact ${id} already defined`);
    }
    if (this.hasArtifactFile(filepath)) {
      throw new Error(`Graph artifact "${filepath}" already defined`);
    }

    const filename = path.relative(this.outdir, filepath);

    if (!(source instanceof CdkGraph)) {
      if (Object.keys(CdkGraphArtifacts).includes(id)) {
        throw new Error(`Graph artifact id ${id} is reserved`);
      }
      if (Object.values(CdkGraphArtifacts).includes(filename as any)) {
        throw new Error(`Graph artifact file ${filename} is reserved`);
      }
    }

    const artifact: CdkGraphArtifact = {
      id,
      filepath,
      description,
      filename,
      source:
        source instanceof CdkGraph
          ? `${CdkGraph.ID}`
          : `plugin:${source.id}@${source.version}`,
    };

    this._artifacts[id] = artifact;

    console.info(
      chalk.cyanBright(
        `[CdkGraph] Artifact ${id} written to ${artifact.filename} (${artifact.source})`
      )
    );

    return artifact;
  }

  /**
   * Writes artifact data to outdir and logs the entry.
   * @param source The source of the artifact, such as the name of plugin
   * @param id Unique id of the artifact
   * @param filename Relative name of the file
   * @param description Description of the artifact
   * @returns
   */
  writeArtifact(
    source: CdkGraph | ICdkGraphPlugin,
    id: string,
    filename: string,
    data: string,
    description?: string
  ): CdkGraphArtifact {
    const filepath = path.join(this.outdir, filename);
    const artifact = this.logArtifact(source, id, filepath, description);

    fs.ensureDirSync(path.dirname(filepath));

    fs.writeFileSync(filepath, data, { encoding: "utf-8" });

    return artifact;
  }
}

/** Callback signature for graph `Plugin.bind` operation */
export interface IGraphPluginBindCallback {
  (graph: CdkGraph): void;
}

/** Callback signature for graph `Plugin.inspect` operation */
export interface IGraphVisitorCallback {
  (construct: IConstruct): void;
}

/** Callback signature for graph `Plugin.synthesize` operation */
export interface IGraphSynthesizeCallback {
  (context: CdkGraphContext): void;
}

/** Callback signature for graph `Plugin.report` operation */
export interface IGraphReportCallback {
  (context: CdkGraphContext): Promise<void>;
}

/** CdkGraph **Plugin** interface */
export interface ICdkGraphPlugin {
  /** Unique identifier for this plugin */
  readonly id: string;
  /** Plugin version */
  readonly version: Version;
  /** List of plugins this plugin depends on, including optional semver version (eg: ["foo", "bar@1.2"]) */
  readonly dependencies?: string[];

  /**
   * Binds the plugin to the CdkGraph instance. Enables plugins to receive base configs.
   */
  bind: IGraphPluginBindCallback;

  /**
   * Node visitor callback for construct tree traversal. This follows IAspect.visit pattern, but the order
   * of visitor traversal in managed by the CdkGraph.
   */
  inspect?: IGraphVisitorCallback;
  /**
   * Called during CDK synthesize to generate synchronous artifacts based on the in-memory graph passed
   * to the plugin. This is called in fifo order of plugins.
   */
  synthesize?: IGraphSynthesizeCallback;
  /**
   * Generate asynchronous reports based on the graph. This is not automatically called when synthesizing CDK.
   * Developer must explicitly add `await graphInstance.report()` to the CDK bin or invoke this outside
   * of the CDK synth. In either case, the plugin receives the in-memory graph interface when invoked, as the
   * CdkGraph will deserialize the graph prior to invoking the plugin report.
   */
  report?: IGraphReportCallback;
}

/** {@link CdkGraph} props */
export interface ICdkGraphProps {
  /** List of plugins to extends the graph. Plugins are invoked at each phases in fifo order. */
  plugins?: ICdkGraphPlugin[];
}

/**
 * CdkGraph construct is the cdk-graph framework controller that is responsible for
 * computing the graph, storing serialized graph, and instrumenting plugins per the
 * plugin contract.
 */
export class CdkGraph extends Construct {
  /** Fixed CdkGraph construct id */
  static readonly ID = GRAPH_ID;
  /** Current CdkGraph semantic version */
  static readonly VERSION = "0.0.0"; // TODO: make dynamic from package

  /** List of plugins registered with this instance */
  readonly plugins: ICdkGraphPlugin[];

  /** @internal */
  private _context?: CdkGraphContext;

  /** Config */
  readonly config: CdkGraphConfig;

  /**
   * Get the context for the graph instance.
   *
   * This will be `undefined` before construct synthesis has initiated.
   */
  get graphContext(): CdkGraphContext | undefined {
    return this._context;
  }

  constructor(public readonly root: Construct, props: ICdkGraphProps = {}) {
    super(root, CdkGraph.ID);

    this.config = resolveConfig();

    this.plugins = props.plugins || [];
    // TODO: verify plugin deps via semver

    // bind all plugins to this instance of the graph
    this.plugins.forEach((plugin) => {
      plugin.bind(this);
    });

    // Apply Aspect for each plugin that supports "inspect" phase
    this.plugins.forEach((plugin) => {
      if (plugin.inspect) {
        Aspects.of(this.root).add({
          visit: plugin.inspect,
        });
      }
    });

    addCustomSynthesis(this, {
      onSynthesize: (session) => {
        this._synthesize(session);
      },
    });
  }

  /** @internal */
  protected _synthesize(session: ISynthesisSession): void {
    const store = computeGraph(this.root);
    const outdir = resolveOutdir(session.outdir, this.config.outdir);
    const context = new CdkGraphContext(store, outdir);

    context.writeArtifact(
      this,
      GRAPH_ARTIFACT_ID,
      CdkGraphArtifacts.GRAPH,
      JSON.stringify(context.store.serialize(), null, 2),
      "Serialized graph"
    );

    this.plugins.forEach((plugin) => {
      plugin.synthesize && plugin.synthesize(context);
    });

    fs.writeFileSync(
      path.join(outdir, CdkGraphArtifacts.GRAPH_METADATA),
      JSON.stringify(
        {
          version: CdkGraph.VERSION,
          artifacts: context.artifacts,
        },
        null,
        2
      ),
      { encoding: "utf-8" }
    );

    // store context for reporting
    this._context = context;
  }

  /**
   * Asynchronous report generation. This operation enables running expensive and non-synchronous
   * report generation by plugins post synthesis.
   *
   * If a given plugin requires performing asynchronous operations or is general expensive, it should
   * utilize `report` rather than `synthesize`.
   */
  public async report() {
    if (this._context == null) {
      // TODO: support deserializing pdk-graph to generate store/context
      console.warn(
        chalk.yellowBright(
          "[CdkGraph] In the near future, reports will be runnable outside of cdk synth"
        )
      );
      throw new Error("CdkGraph report called outside of cdk synth process");
    }
    for (const plugin of this.plugins) {
      plugin.report && (await plugin.report(this._context));
    }
  }
}
