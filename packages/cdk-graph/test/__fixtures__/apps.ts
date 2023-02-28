/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { App, AppProps, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DependentFixtureStack, FixtureStack } from "./stacks";

export class FixtureApp extends App {
  readonly stack: FixtureStack;

  constructor(props?: AppProps) {
    super(props);

    this.stack = new FixtureStack(this, "FixtureStack");
  }
}

export class MultiFixtureApp extends FixtureApp {
  readonly dependentStack: DependentFixtureStack;

  constructor(props?: AppProps) {
    super(props);

    this.dependentStack = new DependentFixtureStack(this, "DependentStack", {
      depStack: this.stack,
    });
  }
}

export class TestStage extends Stage {
  readonly stack: FixtureStack;
  readonly dependentStack: DependentFixtureStack;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.stack = new FixtureStack(this, "FixtureStack");
    this.dependentStack = new DependentFixtureStack(this, "DependentStack", {
      depStack: this.stack,
    });
  }
}

export class StagedApp extends App {
  readonly dev: TestStage;
  readonly staging: TestStage;
  readonly prod: TestStage;

  constructor(props?: AppProps) {
    super(props);

    this.dev = new TestStage(this, "Dev");
    this.staging = new TestStage(this, "Staging");
    this.prod = new TestStage(this, "Prod");
  }
}
