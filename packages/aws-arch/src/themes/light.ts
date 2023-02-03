/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { BasePalette } from "./palette";
import { Theme } from "./types";

/** Light theme color palette */
export enum LightPalette {
  PUBLIC = "#E9F3E6", // Green
  PRIVATE = "#E6F2F8", // Blue

  GENERIC = "#5A6B861A", // 10% almost white

  PRIMARY = "#232F3E", // Dark Blue
  SECONDARY = "#5B9BD5", // Bright Blue
  TERTIARY = "#5A6B86", // Light Bluish Gray
}

/** Light theme definition */
export const LightTheme: Theme = {
  id: "light",
  backgrounds: {
    base: BasePalette.WHITE,
    private: LightPalette.PRIVATE,
    public: LightPalette.PUBLIC,
    generic: LightPalette.GENERIC,
  },
  text: {
    default: BasePalette.BLACK,
    primary: LightPalette.PRIMARY,
    secondary: LightPalette.SECONDARY,
    tertiary: LightPalette.TERTIARY,
  },
  groups: {
    cloud: {
      color: "#242F3E",
      bgcolor: false,
      borderColor: "#242F3E",
      borderStyle: "solid",
      iconPng: "theme/light/groups/AWSCloud.png",
    },
    cloudAlt: {
      color: "#242F3E",
      bgcolor: false,
      borderColor: "#242F3E",
      borderStyle: "solid",
      iconPng: "theme/light/groups/Cloud.png",
    },
    region: {
      color: "#127EBA",
      bgcolor: false,
      borderColor: "#127EBA",
      borderStyle: "dotted",
      iconPng: "theme/light/groups/Region.png",
    },
    availabilityZone: {
      color: "#127EBA",
      bgcolor: false,
      borderColor: "#127EBA",
      borderStyle: "dashed",
    },
    securityGroup: {
      color: "#DF3312",
      bgcolor: false,
      borderColor: "#DF3312",
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
      color: "#3F8624",
      bgcolor: false,
      borderColor: "#3F8624",
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
      color: "#3F8624",
      bgcolor: false,
      borderColor: "#3F8624",
      borderStyle: "none",
      iconPng: "theme/light/groups/PublicSubnet.png",
    },
    serverContents: {
      color: "#596B85",
      bgcolor: false,
      borderColor: "#596B85",
      borderStyle: "solid",
      iconPng: "theme/light/groups/ServerContents.png",
    },
    corporateDataCenter: {
      color: "#596B85",
      bgcolor: false,
      borderColor: "#596B85",
      borderStyle: "solid",
      iconPng: "theme/light/groups/CorporateDataCenter.png",
    },
    ec2InstanceContents: {
      color: "#D86613",
      bgcolor: false,
      borderColor: "#D86613",
      borderStyle: "solid",
      iconPng: "theme/light/groups/EC2InstanceContents.png",
    },
    spotFleet: {
      color: "#D86613",
      bgcolor: false,
      borderColor: "#D86613",
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
      color: "#D86613",
      bgcolor: false,
      borderColor: "#D86613",
      borderStyle: "solid",
      iconPng: "theme/light/groups/ElasticBeanstalkContainer.png",
    },
    awsStepFunctionsWorkflow: {
      color: "#CD2264",
      bgcolor: false,
      borderColor: "#CD2264",
      borderStyle: "solid",
      iconPng: "theme/light/groups/AWSStepFunctionsWorkflow.png",
    },
    generic: {
      color: "#5A6B86",
      bgcolor: false,
      borderColor: "#5A6B86",
      borderStyle: "dashed",
    },
    genericAlt: {
      color: "#000000CC", // 80%
      bgcolor: "#5A6B861A", // 10%
      borderColor: false,
      borderStyle: "none",
    },
  },
  arrows: {
    default: {
      color: LightPalette.GENERIC,
      head: "none",
      tail: "normal",
      width: 0.75,
      style: "solid",
    },
    child: {
      color: LightPalette.TERTIARY,
      tail: "none",
      head: "normal",
      width: 1,
      style: "solid",
    },
    reference: {
      color: LightPalette.TERTIARY,
      tail: "none",
      head: "normal",
      width: 0.75,
      style: "solid",
    },
    dependency: {
      color: LightPalette.SECONDARY,
      tail: "normal",
      head: "odot",
      width: 0.75,
      style: "dotted",
    },
  },
};
