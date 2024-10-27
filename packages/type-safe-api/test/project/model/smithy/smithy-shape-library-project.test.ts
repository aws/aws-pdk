/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { MonorepoTsProject } from "@aws/monorepo";
import { SmithyShapeLibraryProject } from "../../../../src";
import { synthSmithyProject } from "../../snapshot-utils";

describe("Smithy Shape Library Project", () => {
  it("Synth", () => {
    const project = new SmithyShapeLibraryProject({
      name: "smithy-shape-lib",
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Synth with deps", () => {
    const monorepo = new MonorepoTsProject({
      name: "monorepo",
    });

    const dependee = new SmithyShapeLibraryProject({
      parent: monorepo,
      outdir: "dependee",
      name: "dependee",
    });

    const depender = new SmithyShapeLibraryProject({
      parent: monorepo,
      outdir: "depender",
      name: "depender",
    });

    depender.addSmithyDeps(dependee);

    expect(synthSmithyProject(monorepo)).toMatchSnapshot();
  });

  it("Synth with transitive deps", () => {
    const monorepo = new MonorepoTsProject({
      name: "monorepo",
    });

    const a = new SmithyShapeLibraryProject({
      parent: monorepo,
      outdir: "a",
      name: "a",
    });

    const b = new SmithyShapeLibraryProject({
      parent: monorepo,
      outdir: "b",
      name: "b",
    });
    b.addSmithyDeps(a);

    const c = new SmithyShapeLibraryProject({
      parent: monorepo,
      outdir: "c",
      name: "c",
    });
    c.addSmithyDeps(b);

    const d = new SmithyShapeLibraryProject({
      parent: monorepo,
      outdir: "d",
      name: "d",
    });
    d.addSmithyDeps(c);

    expect(synthSmithyProject(monorepo)).toMatchSnapshot();
  });
});
