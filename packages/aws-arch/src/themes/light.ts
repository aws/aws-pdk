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
import { Theme, ThemesEnum } from "./types";

/** Light theme color palette */
export enum LightPalette {
  WHITE = "#FFFFFF",
  BLACK = "#000000",
  BLUE = "#4472C4",
  LIGHT_BLUE = "#5B9BD5",
  ORGANGE = "#ED7D31",
  LIGHT_GRAY = "#A5A5A5",
  GREEN = "#70AD47",
  YELLOW = "#FFC000",
  PUBLIC = "#E9F3E6",
  PRIVATE = "#E6F2F8",
  GENERIC = "#EFF0F3",
  PRIMARY = "#232F3D",
  SECONDARY = "#5A6B86",
}

/** Light theme definition */
export const LightTheme: Theme = {
  id: ThemesEnum.LIGHT,
  backgrounds: {
    base: LightPalette.WHITE,
    private: LightPalette.PRIVATE,
    public: LightPalette.PUBLIC,
    generic: LightPalette.GENERIC,
  },
  text: {
    default: LightPalette.BLACK,
    primary: LightPalette.PRIMARY,
    secondary: LightPalette.SECONDARY,
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
      bgcolor: "#E6F2F8",
      borderColor: "#127EBA",
      borderStyle: "none",
      iconPng: "theme/light/groups/PrivateSubnet.png",
    },
    publicSubnet: {
      color: "#3F8624",
      bgcolor: "#E9F3E6",
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
      color: "#000000",
      bgcolor: "#EFF0F3",
      borderColor: false,
      borderStyle: "none",
    },
  },
  arrows: {
    default: {
      color: LightPalette.LIGHT_GRAY,
      head: "none",
      tail: "normal",
      width: 0.75,
      style: "solid",
    },
    child: {
      color: LightPalette.LIGHT_GRAY,
      tail: "none",
      head: "normal",
      width: 1,
      style: "solid",
    },
    reference: {
      color: LightPalette.ORGANGE,
      tail: "inv",
      head: "dot",
      width: 0.75,
      style: "solid",
    },
    dependency: {
      color: LightPalette.BLUE,
      tail: "invodot",
      head: "odot",
      width: 0.75,
      style: "dotted",
    },
  },
};
