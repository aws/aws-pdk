/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/**
 * Available themes.
 *
 * Using literal string union rather than enum to prevent downstream requirement
 * on importing enum (based on Jsii support)
 */
export type Themes = "light" | "dark";

/** Theme line style values */
export type LineStyle = "solid" | "dotted" | "dashed";

/** Theme group format definition */
export interface GroupFormat {
  readonly color: string | false;
  readonly bgcolor: string | false;
  readonly borderColor: string | false;
  // https://graphviz.org/docs/attr-types/style/
  readonly borderStyle: LineStyle | "none";
  // https://graphviz.org/docs/attrs/labelloc/
  readonly labelLocation?: "t" | "b" | "c";
  readonly iconPng?: string;
}

// https://graphviz.org/doc/info/arrows.html
export type ArrowShape =
  | "box"
  | "crow"
  | "curve"
  | "icurve"
  | "diamond"
  | "dot"
  | "inv"
  | "none"
  | "normal"
  | "tee"
  | "vee"
  | "odot"
  | "invdot"
  | "invodot"
  | "obox"
  | "odiamond";

/** Theme arrow format definition */
export interface ArrowFormat {
  readonly color: string | false;
  readonly head: ArrowShape;
  readonly tail: ArrowShape;
  readonly width: number;
  readonly style: LineStyle;
}

/** Theme text dictionary */
export interface ThemeText {
  readonly default: string;
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
}

/** Theme background dictionary */
export interface ThemeBackgrounds {
  readonly base: string;
  readonly private: string;
  readonly public: string;
  readonly generic: string;
}

/** Theme group dicionary */
export interface ThemeGroups {
  readonly cloud: GroupFormat;
  readonly cloudAlt: GroupFormat;
  readonly region: GroupFormat;
  readonly availabilityZone: GroupFormat;
  readonly securityGroup: GroupFormat;
  readonly autoScalingGroup: GroupFormat;
  readonly vpc: GroupFormat;
  readonly privateSubnet: GroupFormat;
  readonly publicSubnet: GroupFormat;
  readonly serverContents: GroupFormat;
  readonly corporateDataCenter: GroupFormat;
  readonly ec2InstanceContents: GroupFormat;
  readonly spotFleet: GroupFormat;
  readonly awsAccount: GroupFormat;
  readonly awsIoTGreengrassDeployment: GroupFormat;
  readonly awsIoTGreengrass: GroupFormat;
  readonly elasticBeanstalkContainer: GroupFormat;
  readonly awsStepFunctionsWorkflow: GroupFormat;
  readonly generic: GroupFormat;
  readonly genericAlt: GroupFormat;
}

/** Theme arrow dictionary */
export interface ThemeArrows {
  readonly default: ArrowFormat;
  readonly child: ArrowFormat;
  readonly reference: ArrowFormat;
  readonly dependency: ArrowFormat;
}

/** Theme definition */
export interface Theme {
  readonly id: Themes;
  readonly text: ThemeText;
  readonly backgrounds: ThemeBackgrounds;
  readonly groups: ThemeGroups;
  readonly arrows: ThemeArrows;
}
