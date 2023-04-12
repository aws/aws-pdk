/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Component, Project, YamlFile } from "projen";
import { JobStep } from "projen/lib/github/workflows-model";

/** @experimental */
export interface CompositeActionOptions {
  readonly name: string;
  readonly description: string;
}

/** @experimental */
export abstract class CompositeAction extends Component {
  readonly id: string;

  /**
   * @internal
   */
  protected file: YamlFile;

  /**
   * @internal
   */
  protected _preSteps: JobStep[] = [];
  /**
   * @internal
   */
  protected _postSteps: JobStep[] = [];

  get action(): string {
    return `./${this.file.path.replace("/action.yml", "")}`;
  }

  get steps(): JobStep[] {
    return [...this._preSteps, ...this.renderSteps(), ...this._postSteps];
  }

  constructor(project: Project, id: string, options: CompositeActionOptions) {
    super(project);

    this.id = id;

    this.file = new YamlFile(this.project, `.github/actions/${id}/action.yml`, {
      obj: () => ({
        name: options.name,
        description: options.description,
        runs: {
          using: "composite",
          steps: this.steps,
        },
      }),
      // GitHub needs to read the file from the repository in order to work.
      committed: true,
    });
  }

  prependStep(step: JobStep): void {
    this._preSteps.push(step);
  }

  appendStep(step: JobStep): void {
    this._postSteps.push(step);
  }

  use(options?: JobStep): JobStep {
    return {
      name: this.id,
      ...options,
      uses: this.action,
    };
  }

  abstract renderSteps(): JobStep[];
}
