// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-require-imports */

import * as fs from "fs";
import * as path from "path";
const { ProjectGraphBuilder } = require("@nrwl/devkit");

// @ts-ignore
export const processProjectGraph = (graph: any, context: any) => {
  const builder = new ProjectGraphBuilder(graph);

  const nx = JSON.parse(
    fs
      .readFileSync(path.resolve(findRoot(__dirname), "nx.json"))
      .toString("utf-8")
  );
  const implicitDependencies: { [dependant: string]: string[] } =
    nx.implicitDependencies;

  Object.entries(implicitDependencies).forEach(([dependant, dependees]) => {
    dependees.forEach((dependee) =>
      builder.addImplicitDependency(dependant, dependee)
    );
  });

  return builder.getUpdatedProjectGraph();
};

const findRoot = (dir: string): string => {
  if (path.dirname(dir) === dir) {
    return process.cwd();
  } else if (fs.existsSync(path.join(dir, "nx.json"))) {
    return dir;
  } else {
    return findRoot(path.dirname(dir));
  }
};
