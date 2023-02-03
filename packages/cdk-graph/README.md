## CDK Graph (`@aws-prototyping-sdk/cdk-graph`)

![experimental](https://img.shields.io/badge/stability-experimental-orange.svg)
![alpha](https://img.shields.io/badge/version-alpha-red.svg)
[![API Documetnation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](https://aws.github.io/aws-prototyping-sdk/typescript/cdk-graph/index.html)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-prototyping-sdk/tree/mainline/packages/cdk-graph)

> More comprehensive documentation to come as this package stabilizes

This package is the core framework for supporting additional cdk based automation and tooling, such as diagraming, cost modeling, security and compliance, in a holistic and comprehensive way.

This package provides the following functionality:

1. Synthesizes a serialized graph (nodes and edges) from CDK source code.
1. Provides runtime interface for interacting with the graph (in-memory database-like graph store).
1. Provides plugin framework for additional tooling to utilize and extend the graph.

The goal of this framework is to enable bespoke tooling to be built without having to first traverse the CDK Tree and Metadata to build a graph. Projects like [cdk-dia](https://github.com/pistazie/cdk-dia) generate a bespoke in-memory graph that is then utilized to generate diagrams; while the diagram generation is the core value it must first have a graph to act upon and currently is required to generate this undifferentiated graph to provide its diagrams. By standardizing on the graph interface necessary to build complex tooling, we can more rapidly build new tooling that focuses on its core value.

---

### Available Plugins
| Name | Description | Screenshot | Links |
|--- | --- | --- | --- |
| **Diagram** | Generate cloud infrastructure diagrams from cdk graph | <img src="https://github.com/aws/aws-prototyping-sdk/blob/mainline/packages/cdk-graph-plugin-diagram/docs/examples/default.png?raw=true" style="max-width:200px;max-height:200px" /> | [![API Documetnation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](https://aws.github.io/aws-prototyping-sdk/typescript/cdk-graph/index.html) [![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-prototyping-sdk/tree/mainline/packages/cdk-graph) |


---

### Quick Start

#### Instrument CDK App with CdkGraph

```ts
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MyStack } from "../lib/my-stack";

import { CdkGraph } from "@aws-prototyping-sdk/cdk-graph";

const app = new cdk.App();
new MyStack(app, "MyStack");

// Add CdkGraph after other construct added to app
new CdkGraph(app);
```

#### Using Plugins

```ts
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MyStack } from "../lib/my-stack";

import { CdkGraph } from "@aws-prototyping-sdk/cdk-graph";
import { ExamplePlugin } from "@aws-prototyping-sdk/cdk-graph-plugin-example"; // does not exist, just example

const app = new cdk.App();
new MyStack(app, "MyStack");

// Add CdkGraph after other construct added to app
new CdkGraph(app, {
  plugins: [new ExamplePlugin()],
});
```

---

### Config

Configuration is supported through the `.cdkgraphrc.js` and depending on the plugin, through passing config to the plugin instance.

Config precedence follows 1) defaults, 2) cdkgraphrc, 3) instance.

```js
// .cdkgraphrc.js
module.exports = {
  // Defaults to "<cdk.out>/cdkgraph"
  outdir: "reports/graph",

  // plugin configuration
  example: {
    verbose: true,
    reportType: "csv",
  },
};
```

```ts
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MyStack } from "../lib/my-stack";

import { CdkGraph } from "@aws-prototyping-sdk/cdk-graph";
import { ExamplePlugin } from "@aws-prototyping-sdk/cdk-graph-plugin-example"; // does not exist, just example

const app = new cdk.App();
new MyStack(app, "MyStack");

// Add CdkGraph after other construct added to app
new CdkGraph(app, {
  plugins: [
    new ExamplePlugin({
      // Will override .cdkgraphrc.js value
      verbose: false,
    }),
  ],
});
```

---

### Plugin Interface

```ts
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
```

Plugin operations are automatically invoked by CdkGraph in the order they are defined in the `plugins` property. The invocation flow of plugins follows: 1) `bind`, 2) `inspect`, 3) `synthesize`, 4) `async report`.

### Asynchronous Plugins

Some plugins may requiring performing asynchronous requests, or may make expensive operations that are best left outside of the synthesis process.

CdkGraph support asynchronous operations through the `async report()` method of plugins. However, since CDK does not support asynchronous operations during synthesis, this must be wired up a bit differently.

```ts
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MyStack } from "../lib/my-stack";

import { CdkGraph } from "@aws-prototyping-sdk/cdk-graph";
import { ExampleAsyncPlugin } from "@aws-prototyping-sdk/cdk-graph-plugin-async-example"; // does not exist, just example

(async () => {
  const app = new cdk.App();
  new MyStack(app, "MyStack");

  // Add CdkGraph after other construct added to app
  const graph = new CdkGraph(app, {
    plugins: [new ExampleAsyncPlugin()],
  });

  // invokes all plugin `report()` operations asynchronously (in order they are defined in `plugins` property)
  await graph.report();
})();
```

### Example Plugin Implementation

Very basic example of implementing a plugin. Once the first actual plugins have been published this will be updated to reference those as examples.

```ts
import {
  CdkGraph,
  CdkGraphContext,
  ICdkGraphPlugin,
} from "@aws-prototyping-sdk/cdk-graph";

export class CdkGraphExamplePlugin implements ICdkGraphPlugin {
  static readonly ARTIFACT_NS = "EXAMPLE";
  static readonly ID = "example";
  static readonly VERSION = "0.0.0";

  get id(): string {
    return CdkGraphDiagramPlugin.ID;
  }
  get version(): string {
    return CdkGraphDiagramPlugin.VERSION;
  }

  readonly dependencies?: string[] = [];

  /** @internal */
  private _graph?: CdkGraph;

  bind(graph: CdkGraph): void {
    this._graph = graph;
  }

  synthesize(context: CdkGraphContext): void {
    const pluginConfig = this.config as Required<IPluginConfig>;

    // Get counts of all resources
    const cfnResourceCounts = context.store.counts.cfnResources;

    // Write plugin artifact
    context.writeArtifact(
      this,
      "EXAMPLE",
      "example.json",
      JSON.stringify(cfnResourceCounts, null, 2)
    );
  }

  async report(context: CdkGraphContext): void {
    // perform async operation here utilizing graph store
    const cfnResourceCounts = context.store.counts.cfnResources;
    const fetchedData = await fetch("https://example.com/data", {
      method: "POST",
      body: JSON.stringify(cfnResourceCounts),
    });

    // Write plugin artifact for fetched data
    context.writeArtifact(
      this,
      "EXAMPLE:FETCHED",
      "example-fetched.json",
      JSON.stringify(fetchedData, null, 2)
    );
  }
}
```

### Path to Stability

The below is a rough checklist of task necessary to elevate this from experimental to stable.

- [ ] Dynamic versioning and Semver enforcement (store, plugins, etc)
- [ ] Support running `async report()` method outside of CDK synthesis process
- [ ] Find alternative synthesis solution that doesn't utilize CDK internals
- [ ] Support custom Nodes and Edges
- [ ] Improve logging, bookkeeping, and debugging
- [ ] Implement store upgrade solution
- [ ] Battle test the implementation against several plugins
- [ ] Battle test the implementation in all target languages (currently tested in Typescript, but vended in all PDK supported languages)
- [ ] Receive community feedback to validate approach
