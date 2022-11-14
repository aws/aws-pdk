/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { normalizeIdentifier } from "../../utils";

/** Default font color for categories */
export const CATEGORY_DEFAULT_FONT_COLOR = "#232F3E";

/** Category definition */
export interface AwsCategoryDefinition {
  readonly id: string;
  readonly name: string;
  readonly fillColor: string;
  readonly gradientColor: string;
  readonly fontColor?: string;
  readonly variants?: string[];
}

/** Record of all category definitions keyed by id */
export const AwsCategoryDefinitions = {
  analytics: {
    id: "analytics",
    name: "Analytics",
    fillColor: "#5A30B5",
    gradientColor: "#945DF2",
  } as AwsCategoryDefinition,
  application_integration: {
    id: "application_integration",
    name: "Application Integration",
    fillColor: "#BC1356",
    gradientColor: "#F34482",
    variants: ["app_integration"],
  } as AwsCategoryDefinition,
  blockchain: {
    id: "blockchain",
    name: "Blockchain",
    fillColor: "#D05C17",
    gradientColor: "#F78E04",
  } as AwsCategoryDefinition,
  business_applications: {
    id: "business_applications",
    name: "Business Applications",
    fillColor: "#C7131F",
    gradientColor: "#F54749",
    variants: ["business_application"],
  } as AwsCategoryDefinition,
  cloud_financial_management: {
    id: "cloud_financial_management",
    name: "Cloud Financial Management",
    fillColor: "#277116",
    gradientColor: "#60A337",
    variants: ["cost_management"],
  } as AwsCategoryDefinition,
  compute: {
    id: "compute",
    name: "Compute",
    fillColor: "#D05C17",
    gradientColor: "#F78E04",
  } as AwsCategoryDefinition,
  containers: {
    id: "containers",
    name: "Containers",
    fillColor: "#D05C17",
    gradientColor: "#F78E04",
  } as AwsCategoryDefinition,
  customer_enablement: {
    id: "customer_enablement",
    name: "Customer Enablement",
    fillColor: "#3334B9",
    gradientColor: "#4D72F3",
    variants: ["customer_engagement"],
  } as AwsCategoryDefinition,
  database: {
    id: "database",
    name: "Database",
    fillColor: "#3334B9",
    gradientColor: "#4D72F3",
  } as AwsCategoryDefinition,
  developer_tools: {
    id: "developer_tools",
    name: "Developer Tools",
    fillColor: "#3334B9",
    gradientColor: "#4D72F3",
  } as AwsCategoryDefinition,
  end_user_computing: {
    id: "end_user_computing",
    name: "End User Computing",
    fillColor: "#116D5B",
    gradientColor: "#4AB29A",
    variants: ["desktop_and_app_streaming"],
  } as AwsCategoryDefinition,
  front_end_web_mobile: {
    id: "front_end_web_mobile",
    name: "Front-End Web & Mobile",
    fillColor: "#C7131F",
    gradientColor: "#F54749",
    variants: ["mobile"],
  } as AwsCategoryDefinition,
  game_tech: {
    id: "game_tech",
    name: "Game Tech",
    fillColor: "#5A30B5",
    gradientColor: "#945DF2",
  } as AwsCategoryDefinition,
  general: {
    id: "general",
    name: "General",
    fillColor: "#1E262E",
    gradientColor: "#505863",
    variants: ["general_resources", "general_icons", "illustrations"],
  } as AwsCategoryDefinition,
  internet_of_things: {
    id: "internet_of_things",
    name: "Internet of Things",
    fillColor: "#277116",
    gradientColor: "#60A337",
    variants: ["iot", "lot"], // lot is miss spelling of some iot assets
  } as AwsCategoryDefinition,
  machine_learning: {
    id: "machine_learning",
    name: "Machine Learning",
    fillColor: "#116D5B",
    gradientColor: "#4AB29A",
    variants: ["ml"],
  } as AwsCategoryDefinition,
  management_governance: {
    id: "management_governance",
    name: "Management & Governance",
    fillColor: "#BC1356",
    gradientColor: "#F34482",
    variants: ["management_and_governance"],
  } as AwsCategoryDefinition,
  media_services: {
    id: "media_services",
    name: "Media_services",
    fillColor: "#D05C17",
    gradientColor: "#F78E04",
  } as AwsCategoryDefinition,
  migration_transfer: {
    id: "migration_transfer",
    name: "Migration & Transfer",
    fillColor: "#116D5B",
    gradientColor: "#4AB29A",
    variants: ["migration_and_transfer"],
  } as AwsCategoryDefinition,
  networking_content_delivery: {
    id: "networking_content_delivery",
    name: "Networking & Content Delivery",
    fillColor: "#5A30B5",
    gradientColor: "#945DF2",
    variants: ["networking_and_content_delivery"],
  } as AwsCategoryDefinition,
  quantum_technologies: {
    id: "quantum_technologies",
    name: "Quantum Technologies",
    fillColor: "#D05C17",
    gradientColor: "#F78E04",
  } as AwsCategoryDefinition,
  robotics: {
    id: "robotics",
    name: "Robotics",
    fillColor: "#BE0917",
    gradientColor: "#FE5151",
  } as AwsCategoryDefinition,
  satellite: {
    id: "satellite",
    name: "Satellite",
    fillColor: "#2F29AF",
    gradientColor: "#517DFD",
  } as AwsCategoryDefinition,
  security_identity_compliance: {
    id: "security_identity_compliance",
    name: "Security, Identity, & Compliance",
    fillColor: "#C7131F",
    gradientColor: "#F54749",
    variants: ["security_identity_and_compliance"],
  } as AwsCategoryDefinition,
  serverless: {
    id: "serverless",
    name: "Serverless",
    fillColor: "#5A30B5",
    gradientColor: "#945DF2",
  } as AwsCategoryDefinition,
  storage: {
    id: "storage",
    name: "Storage",
    fillColor: "#277116",
    gradientColor: "#60A337",
  } as AwsCategoryDefinition,
  vr_ar: {
    id: "vr_ar",
    name: "VR & AR",
    fillColor: "#BC1356",
    gradientColor: "#F34482",
    variants: ["ar_vr", "xr"],
  } as AwsCategoryDefinition,
} as const;

/** Literal union of all available category ids */
export type AwsCategoryId = keyof typeof AwsCategoryDefinitions;

/** Find category definition for given value */
export function findAwsCategoryDefinition(
  value: string
): AwsCategoryDefinition {
  value = normalizeIdentifier(value);

  if (value in AwsCategoryDefinitions) {
    return AwsCategoryDefinitions[value as AwsCategoryId];
  }

  const category = Object.values(AwsCategoryDefinitions).find((_category) => {
    return _category.variants?.includes(value);
  });

  if (category == null) {
    throw new Error(`AwsCategorgies does not have match for ${value}`);
  }

  return category;
}

export const GENERAL_CATEGORY_ID = AwsCategoryDefinitions.general.id;
