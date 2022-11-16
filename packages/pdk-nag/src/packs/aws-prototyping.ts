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
import { CfnResource } from "aws-cdk-lib";
import { NagPack, NagPackProps } from "cdk-nag";
import { IConstruct } from "constructs";
import { PackName, RuleMetadata } from "./aws-prototyping-rules";

export class AwsPrototypingChecks extends NagPack {
  constructor(props?: NagPackProps) {
    super(props);
    this.packName = PackName;
  }
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      RuleMetadata.forEach((rule) => {
        this.applyRule({
          ...rule,
          node,
        });
      });
    }
  }
}
