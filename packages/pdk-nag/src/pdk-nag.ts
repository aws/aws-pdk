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
import {
  App,
  AppProps,
  Aspects,
  Stack,
  StageSynthesisOptions,
} from "aws-cdk-lib";
import { CloudAssembly } from "aws-cdk-lib/cx-api";
import {
  AwsSolutionsChecks,
  NagPackSuppression,
  NagSuppressions,
} from "cdk-nag";
import { IConstruct } from "constructs";

const CDK_NAG_MESSAGE_TYPES = {
  ERROR: "aws:cdk:error",
  WARNING: "aws:cdk:warning",
};
const CDK_NAG_MESSAGE_TYPES_SET = new Set(Object.values(CDK_NAG_MESSAGE_TYPES));

/**
 * Message instance.
 */
export interface Message {
  /**
   * Message description.
   */
  readonly messageDescription: string;

  /**
   * Message type as returned from cdk-nag.
   */
  readonly messageType: string;
}

/**
 * Nag result.
 */
export interface NagResult {
  /**
   * Resource which triggered the message.
   */
  readonly resource: string;

  /**
   * List of messages.
   */
  readonly messages: Message[];
}

/**
 * @inheritDoc
 */
export interface PDKNagAppProps extends AppProps {
  /**
   * Determines whether any errors encountered should trigger a test failure.
   *
   * @default true
   */
  readonly failOnError?: boolean;

  /**
   * Determines whether any warnings encountered should trigger a test failure.
   *
   * @default false
   */
  readonly failOnWarning?: boolean;
}

/**
 * @inheritDoc
 */
export class PDKNagApp extends App {
  private readonly _nagResults: NagResult[] = [];
  private readonly failOnError: boolean;
  private readonly failOnWarning: boolean;

  constructor(props?: PDKNagAppProps) {
    super(props);
    this.failOnError = props?.failOnError ?? true;
    this.failOnWarning = props?.failOnWarning ?? false;
  }

  synth(options?: StageSynthesisOptions): CloudAssembly {
    const assembly = super.synth(options);

    const typesToFail = new Set(
      [
        this.failOnError && CDK_NAG_MESSAGE_TYPES.ERROR,
        this.failOnWarning && CDK_NAG_MESSAGE_TYPES.WARNING,
      ].filter((t) => t)
    );
    if (
      this._nagResults.find((r) =>
        r.messages.find((m) => typesToFail.has(m.messageType))
      )
    ) {
      throw new Error(JSON.stringify(this._nagResults, undefined, 2));
    }

    return assembly;
  }

  addNagResult(result: NagResult) {
    this._nagResults.push(result);
  }

  /**
   * Returns a list of NagResult.
   *
   * Note: app.synth() must be called before this to retrieve results.
   */
  public nagResults(): NagResult[] {
    return this._nagResults;
  }
}

class PDKNagAspect extends AwsSolutionsChecks {
  private readonly app: PDKNagApp;

  constructor(app: PDKNagApp) {
    super({
      verbose: true,
      reports: true,
    });
    this.app = app;
  }

  visit(node: IConstruct): void {
    super.visit(node);

    const results = node.node.metadata.filter((m) =>
      CDK_NAG_MESSAGE_TYPES_SET.has(m.type)
    );
    results.length > 0 &&
      this.app.addNagResult({
        resource: node.node.path,
        messages: results.map((m) => ({
          messageDescription: m.data,
          messageType: m.type,
        })),
      });
  }
}

/**
 * Helper for create a Nag Enabled App.
 */
export class PDKNag {
  /**
   * Returns an instance of an App with Nag enabled.
   *
   * @param props props to initialize the app with.
   */
  public static app(props?: PDKNagAppProps): PDKNagApp {
    const app = new PDKNagApp(props);
    Aspects.of(app).add(new PDKNagAspect(app));

    return app;
  }

  /**
   * Wrapper around NagSuppressions which does not throw.
   *
   * @param stack stack instance
   * @param path resource path
   * @param suppressions list of suppressions to apply.
   * @param applyToChildren whether to apply to children.
   */
  public static addResourceSuppressionsByPathNoThrow(
    stack: Stack,
    path: string,
    suppressions: NagPackSuppression[],
    applyToChildren: boolean = false
  ): void {
    try {
      NagSuppressions.addResourceSuppressionsByPath(
        stack,
        path,
        suppressions,
        applyToChildren
      );
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Returns a prefix comprising of a delimited set of Stack Ids.
   *
   * For example: StackA/NestedStackB/
   *
   * @param stack stack instance.
   */
  public static getStackPrefix(stack: Stack): string {
    if (stack.nested) {
      return `${PDKNag.getStackPrefix(stack.nestedStackParent!)}${
        stack.node.id
      }/`;
    } else {
      return `${stack.stackName}/`;
    }
  }

  /**
   * Returns a stack partition regex.
   *
   * @param stack stack instance.
   */
  public static getStackPartitionRegex(stack: Stack): string {
    if (stack.nested) {
      return PDKNag.getStackPartitionRegex(stack.nestedStackParent!);
    } else {
      return stack.partition.startsWith("${Token")
        ? "<AWS::Partition>"
        : `(<AWS::Partition>|${stack.partition})`;
    }
  }

  /**
   * Returns a stack region regex.
   *
   * @param stack stack instance.
   */
  public static getStackRegionRegex(stack: Stack): string {
    if (stack.nested) {
      return PDKNag.getStackRegionRegex(stack.nestedStackParent!);
    } else {
      return stack.region.startsWith("${Token")
        ? "<AWS::Region>"
        : `(<AWS::Region>|${stack.region})`;
    }
  }

  /**
   * Returns a stack account regex.
   *
   * @param stack stack instance.
   */
  public static getStackAccountRegex(stack: Stack): string {
    if (stack.nested) {
      return PDKNag.getStackAccountRegex(stack.nestedStackParent!);
    } else {
      return stack.account.startsWith("${Token")
        ? "<AWS::AccountId>"
        : `(<AWS::AccountId>|${stack.account})`;
    }
  }
}
