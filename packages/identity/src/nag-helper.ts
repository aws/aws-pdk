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
import { Stack } from "aws-cdk-lib";

/**
 * Returns a prefix comprising of a delimited set of Stack Ids.
 *
 * For example: StackA/NestedStackB/
 *
 * TODO: Move this into a shared helper library.
 *
 * @param stack stack instance.
 */
export const getStackPrefix = (stack: Stack): string => {
  if (stack.nested) {
    return `${getStackPrefix(stack.nestedStackParent!)}${stack.node.id}/`;
  } else {
    return `${stack.stackName}/`;
  }
};
