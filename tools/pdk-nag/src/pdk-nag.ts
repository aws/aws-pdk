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
import { App, AppProps, Aspects, StageSynthesisOptions } from 'aws-cdk-lib';
import { CloudAssembly } from 'aws-cdk-lib/cx-api';
import { AwsSolutionsChecks } from 'cdk-nag';
import { IConstruct } from 'constructs';

const CDK_NAG_MESSAGE_TYPES = { ERROR: 'aws:cdk:error', WARNING: 'aws:cdk:warning' };

/**
 * Message instance.
 */
export interface Message {
  /**
   * Message description.
   */
  readonly message: string;

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
}

/**
 * @inheritDoc
 */
export class PDKNagApp extends App {
  private readonly nagResults: NagResult[] = [];
  private readonly failOnError: boolean;

  constructor(props?: PDKNagAppProps) {
    super(props);
    this.failOnError = props?.failOnError ?? true;
  }

  synth(options?: StageSynthesisOptions): CloudAssembly {
    const assembly = super.synth(options);

    if (this.failOnError && this.nagResults.find(r => r.messages.find(m => m.messageType === CDK_NAG_MESSAGE_TYPES.ERROR))) {
      throw new Error(JSON.stringify(this.nagResults, undefined, 2));
    }

    return assembly;
  }

  addNagResult(result: NagResult) {
    this.nagResults.push(result);
  }


  /**
   * Returns a list of NagResult.
   *
   * Note: app.synth() must be called before this to retrieve results.
   */
  public getNagResults(): NagResult[] {
    return this.nagResults;
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

    const results = node.node.metadata.filter(m => Object.values(CDK_NAG_MESSAGE_TYPES).find(v => v === m.type));
    results.length > 0 && this.app.addNagResult({
      resource: node.node.path,
      messages: results.map(m => ({
        message: m.data,
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
}