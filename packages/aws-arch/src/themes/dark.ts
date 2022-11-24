/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { BasePalette } from "./palette";
import { Theme } from "./types";

/** Dark theme color palette */
export enum DarkPalette {
  PUBLIC = "#E9F3E6", // Green
  PRIVATE = "#E6F2F8", // Blue

  GENERIC = "#FAFAFA33", // 20% almost white

  PRIMARY = "#FAFAFA", // Almost White
  SECONDARY = "#5B9BD5", // Bright Blue
  TERTIARY = "#8FA7C4", // Light Bluish Gray
}

/** Dark theme definition */
export const DarkTheme: Theme = {
  id: "dark",
  backgrounds: {
    base: BasePalette.DARK_BLUE,
    private: DarkPalette.PRIVATE,
    public: DarkPalette.PUBLIC,
    generic: DarkPalette.GENERIC,
  },
  text: {
    default: BasePalette.WHITE,
    primary: DarkPalette.PRIMARY,
    secondary: DarkPalette.SECONDARY,
    tertiary: DarkPalette.TERTIARY,
  },
  groups: {
    cloud: {
      color: "#FAFAFA",
      bgcolor: false,
      borderColor: "#FAFAFA",
      borderStyle: "solid",
      iconPng: "theme/light/groups/AWSCloud.png",
    },
    cloudAlt: {
      color: "#FAFAFA",
      bgcolor: false,
      borderColor: "#FAFAFA",
      borderStyle: "solid",
      iconPng: "theme/light/groups/Cloud.png",
    },
    region: {
      color: "#00A0C8",
      bgcolor: false,
      borderColor: "#00A0C8",
      borderStyle: "dotted",
      iconPng: "theme/light/groups/Region.png",
    },
    availabilityZone: {
      color: "#00A0C8",
      bgcolor: false,
      borderColor: "#00A0C8",
      borderStyle: "dashed",
    },
    securityGroup: {
      color: "#FC584C",
      bgcolor: false,
      borderColor: "#FC584C",
      borderStyle: "solid",
    },
    autoScalingGroup: {
      color: "#D86613",
      bgcolor: false,
      borderColor: "#D86613",
      borderStyle: "dashed",
      iconPng: "theme/light/groups/AutoScalingGroup.png",
    },
    vpc: {
      color: "#69AE35",
      bgcolor: false,
      borderColor: "#69AE35",
      borderStyle: "solid",
      iconPng: "theme/light/groups/VPC.png",
    },
    privateSubnet: {
      color: "#127EBA",
      bgcolor: false,
      borderColor: "#127EBA",
      borderStyle: "none",
      iconPng: "theme/light/groups/PrivateSubnet.png",
    },
    publicSubnet: {
      color: "#69AE35",
      bgcolor: false,
      borderColor: "#69AE35",
      borderStyle: "none",
      iconPng: "theme/light/groups/PublicSubnet.png",
    },
    serverContents: {
      color: "#8FA7C4",
      bgcolor: false,
      borderColor: "#8FA7C4",
      borderStyle: "solid",
      iconPng: "theme/light/groups/ServerContents.png",
    },
    corporateDataCenter: {
      color: "#8FA7C4",
      bgcolor: false,
      borderColor: "#8FA7C4",
      borderStyle: "solid",
      iconPng: "theme/light/groups/CorporateDataCenter.png",
    },
    ec2InstanceContents: {
      color: "#FF9900",
      bgcolor: false,
      borderColor: "#FF9900",
      borderStyle: "solid",
      iconPng: "theme/light/groups/EC2InstanceContents.png",
    },
    spotFleet: {
      color: "#FF9900",
      bgcolor: false,
      borderColor: "#FF9900",
      borderStyle: "solid",
      iconPng: "theme/light/groups/SpotFleet.png",
    },
    awsAccount: {
      color: "#B0084D",
      bgcolor: false,
      borderColor: "#B0084D",
      borderStyle: "solid",
      iconPng: "theme/light/groups/AWSAccount.png",
    },
    awsIoTGreengrassDeployment: {
      color: "#3F8624",
      bgcolor: false,
      borderColor: "#3F8624",
      borderStyle: "solid",
      iconPng: "theme/light/groups/AWSIoTGreengrassDeployment.png",
    },
    awsIoTGreengrass: {
      color: "#3F8624",
      bgcolor: false,
      borderColor: "#3F8624",
      borderStyle: "solid",
      iconPng: "theme/light/groups/AWSIoTGreengrass.png",
    },
    elasticBeanstalkContainer: {
      color: "#FF9900",
      bgcolor: false,
      borderColor: "#FF9900",
      borderStyle: "solid",
      iconPng: "theme/light/groups/ElasticBeanstalkContainer.png",
    },
    awsStepFunctionsWorkflow: {
      color: "#FF4F8B",
      bgcolor: false,
      borderColor: "#FF4F8B",
      borderStyle: "solid",
      iconPng: "theme/light/groups/AWSStepFunctionsWorkflow.png",
    },
    generic: {
      color: "#8FA7C4",
      bgcolor: "magenta",
      borderColor: "#8FA7C4",
      borderStyle: "dashed",
    },
    genericAlt: {
      color: "#FAFAFACC", // 80%
      bgcolor: "#FAFAFA33", // 20%
      borderColor: false,
      borderStyle: "none",
    },
  },
  arrows: {
    default: {
      color: DarkPalette.GENERIC,
      head: "none",
      tail: "normal",
      width: 0.75,
      style: "solid",
    },
    child: {
      color: DarkPalette.TERTIARY,
      tail: "none",
      head: "normal",
      width: 1,
      style: "solid",
    },
    reference: {
      color: DarkPalette.TERTIARY,
      head: "none",
      tail: "normal",
      width: 0.75,
      style: "solid",
    },
    dependency: {
      color: DarkPalette.SECONDARY,
      tail: "normal",
      head: "odot",
      width: 0.75,
      style: "dotted",
    },
  },
};
