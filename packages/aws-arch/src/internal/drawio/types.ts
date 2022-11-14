/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
/** Draiwio aws4 parent shapes enum */
export enum DrawioAws4ParentShapes {
  RESOURCE_ICON = "mxgraph.aws4.resourceIcon",
}

/** Base definition of drawio aws shape style */
export interface DrawioAwsShapeStyleBase {
  readonly outlineConnect: 0 | 1;
  readonly gradientDirection: string;
  readonly strokeColor: string;
  readonly dashed: 0 | 1;
  readonly verticalLabelPosition: string;
  readonly verticalAlign: string;
  readonly align: string;
  readonly html: 0 | 1;
  readonly fontSize: number;
  readonly fontStyle: 0 | string;
  readonly aspect: "fixed";
  readonly pointerEvent?: 0 | 1;
}

/** Based style definition for drawio aws resource icon */
export interface DrawioAwsResourceIconStyleBase
  extends DrawioAwsShapeStyleBase {
  readonly fillColor: string;
  readonly gradientColor: string;
  readonly fontColor: string;
}

/** Base drawio aws resource style */
export const DRAWIO_RESOURCE_STYLE_BASE: DrawioAwsShapeStyleBase = {
  outlineConnect: 0,
  gradientDirection: "north",
  strokeColor: "#ffffff",
  dashed: 0,
  verticalLabelPosition: "bottom",
  verticalAlign: "top",
  align: "center",
  html: 1,
  fontSize: 12,
  fontStyle: 0,
  aspect: "fixed",
};

/** Convert drawio style object to style string */
export function drawioStyleObjectToString(
  styleObject: DrawioAwsShapeStyleBase
): string {
  return Object.entries(styleObject)
    .map(([key, value]) => `${key}=${value};`)
    .join("");
}
