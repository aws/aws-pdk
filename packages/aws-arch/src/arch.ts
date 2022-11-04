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
import * as path from "path";
import { ASSET_DIRNAME } from "./contants";
import { AwsAsset } from "./generated/assets";
import { CfnSpec } from "./generated/cfnspec";
import { DrawioSpec } from "./generated/drawio-spec";
import { AwsServiceMapping, AwsResourceMapping } from "./generated/mappings";
import { parseAssetPath } from "./internal/assets/helpers";
import {
  AwsCategoryDefinitions,
  AwsCategoryDefinition,
  AwsCategoryId,
  CATEGORY_DEFAULT_FONT_COLOR,
  GENERAL_CATEGORY_ID,
} from "./internal/categories/definitions";
import {
  DrawioAws4ParentShapes,
  DrawioAwsResourceIconStyleBase,
  DRAWIO_RESOURCE_STYLE_BASE,
} from "./internal/drawio/types";
import { CfnMappedService, CfnMappedResource } from "./internal/mapping/types";
import { PricingManifest } from "./internal/pricing-manifest";
import { ThemesEnum } from "./themes";
import * as themes from "./themes";

/**
 * Available icon formats for assets.
 */
export type IconFormats = "png" | "svg";

/**
 * Drawio resource icon style definition for AWS Resources
 * @struct
 */
export interface AwsDrawioResourceIconStyle
  extends DrawioAwsResourceIconStyleBase {
  readonly shape: DrawioAws4ParentShapes.RESOURCE_ICON;
  readonly resIcon: DrawioSpec.Aws4.ShapeNames;
}
/**
 * Drawio shape based style definition.
 * @struct
 */
export interface AwsDrawioShapeStyle extends DrawioAwsResourceIconStyleBase {
  readonly shape: DrawioSpec.Aws4.ShapeNames;
}

/**
 * AwsCategoryDrawioStyles is a utility class for constructing drawio shape
 * styles for services and resources.
 */
export class AwsCategoryDrawioStyles {
  readonly categoryShape: DrawioSpec.Aws4.ShapeNames;
  readonly base: DrawioAwsResourceIconStyleBase;

  constructor(
    categoryShape: DrawioSpec.Aws4.ShapeNames,
    base: DrawioAwsResourceIconStyleBase
  ) {
    this.categoryShape = categoryShape;
    this.base = base;
  }

  /**
   * Get the drawio style for this category.
   */
  get categoryStyle(): AwsDrawioResourceIconStyle {
    return {
      ...this.base,
      shape: DrawioAws4ParentShapes.RESOURCE_ICON,
      resIcon: this.categoryShape,
    };
  }

  /**
   * Gets the drawio style for a service based on the category style.
   * @param serviceShape The service shape to style based on category
   * @returns {AwsDrawioResourceIconStyle} The style drawio style definition for the resource based on category style.
   */
  getServiceStyle(
    serviceShape: DrawioSpec.Aws4.ShapeNames
  ): AwsDrawioResourceIconStyle {
    return {
      ...this.categoryStyle,
      resIcon: serviceShape,
    };
  }

  /**
   * Gets the drawio style for a resource based on the category style.
   * @param resourceShape The resource shape to style based on category
   * @returns {AwsDrawioResourceIconStyle} The style drawio style definition for the resource based on category style.
   */
  getResourceStyle(
    resourceShape: DrawioSpec.Aws4.ShapeNames
  ): AwsDrawioShapeStyle {
    const { resIcon, ...categoryStyle } = this.categoryStyle;
    return {
      ...categoryStyle,
      shape: resourceShape,
      pointerEvent: 1,
      strokeColor: "none",
    };
  }
}

/**
 * Type for category dictionary.
 */
export type TAwsCategoryDict = { [key: string]: AwsCategory };

/**
 * AwsCategory class provides an interface for normalizing category metadata
 * between mapped systems.
 */
export class AwsCategory {
  /** @internal */
  static _register(definition: AwsCategoryDefinition): AwsCategory {
    const instance = new AwsCategory(definition);
    this._instanceMap.set(definition.id as AwsCategoryId, instance);
    return instance;
  }

  /**
   * Get {@link AwsCategory} based on {@link AwsCategoryId}
   * @param id {AwsCategoryId} The id of the category to retrieve.
   * @returns Returns the category with the id
   */
  static getCategory(id: AwsCategoryId): AwsCategory {
    if (this._instanceMap.has(id)) {
      return this._instanceMap.get(id)!;
    }

    throw new Error(`AwsCategory ${id} is not registered`);
  }

  /** @internal */
  private static _instanceMap: Map<AwsCategoryId, AwsCategory> = new Map();

  /**
   * Get record of all categories keyed by category id.
   */
  static get categories(): TAwsCategoryDict {
    return Object.fromEntries(this._instanceMap.entries()) as any;
  }

  /**
   * The unique id of the category.
   *
   * @example "security_identity_compliance"
   */
  readonly id: AwsCategoryId;
  /**
   * The proper name of the category.
   *
   * @example "Security, Identity, & Compliance"
   */
  readonly name: string;
  /**
   * Fill color for the category.
   */
  readonly fillColor: string;
  /**
   * Gradien color for the category.
   */
  readonly gradientColor: string;
  /**
   * Font color for the category.
   */
  readonly fontColor: string;
  /**
   * Alternative names used to identity this category.
   */
  readonly variants: string[];

  /**
   * Drawio style definition for this category.
   */
  readonly drawioStyles?: AwsCategoryDrawioStyles;

  /** @internal */
  private readonly _assetIcon?: string;
  /** @internal */
  private _services?: AwsService[];

  /** @internal */
  private constructor(definition: AwsCategoryDefinition) {
    this.id = definition.id as AwsCategoryId;
    this.name = definition.name;
    this.variants = [...(definition.variants || [])];
    this.fillColor = definition.fillColor;
    this.gradientColor = definition.gradientColor;
    this.fontColor = definition.fontColor || CATEGORY_DEFAULT_FONT_COLOR;

    if (this.id !== GENERAL_CATEGORY_ID) {
      if (this.id in AwsAsset.Categories) {
        this._assetIcon = AwsAsset.Categories[this.id as AwsAsset.Category];
      } else {
        throw new Error(
          `AwsCategory id "${this.id}" does not match AwsAsset.Category`
        );
      }
    }

    const drawioShape = [this.id, ...this.variants].find(
      (v) => v.toUpperCase() in DrawioSpec.Aws4.ShapeNames
    );
    if (drawioShape) {
      this.drawioStyles = new AwsCategoryDrawioStyles(
        drawioShape as DrawioSpec.Aws4.ShapeNames,
        {
          ...DRAWIO_RESOURCE_STYLE_BASE,
          fillColor: this.fillColor,
          gradientColor: this.gradientColor,
          fontColor: this.fontColor,
        }
      );
    }
  }

  /**
   * Retrieves a well-formatted relative path to the icon for this given
   * category in the specified format.
   */
  icon(format: IconFormats, theme?: ThemesEnum): string | undefined {
    if (this._assetIcon == null) return;
    try {
      return AwsArchitecture.formatAssetPath(this._assetIcon, format, theme);
    } catch {}

    return;
  }

  /**
   * Gets a list of all services within this category.
   */
  categoryServices(): AwsService[] {
    if (this._services == null) {
      this._services = Object.values(AwsService.services).filter(
        (service) => service.category === this
      );
    }

    return this._services;
  }
}

// Register all categories
for (const categoryDefinition of Object.values(AwsCategoryDefinitions)) {
  AwsCategory._register(categoryDefinition);
}

/**
 * Type for service dictionary.
 */
export type TAwsServiceDict = { [key: string]: AwsService };

/**
 * AwsService class provides an interface for normalizing service metadata
 * between mapped systems.
 */
export class AwsService {
  /** @internal */
  static _register(
    cfnKey: CfnSpec.ServiceName,
    cfnMapped: CfnMappedService
  ): AwsService {
    const instance = new AwsService(cfnKey, cfnMapped);
    this._instanceMap.set(cfnKey, instance);
    return instance;
  }

  /**
   * Get {@link AwsService} by CloudFormation "service" name, where service name is expressed
   * as `<provider>::<service>::<resource>`.
   * @param cfnService The service name to retrieve {@link AwsService} for.
   * @returns Returns the {@link AwsService} associated with the `cfnService` provided
   * @throws Error is service not found
   */
  static getService(cfnService: CfnSpec.ServiceName): AwsService {
    if (this._instanceMap.has(cfnService)) {
      return this._instanceMap.get(cfnService)!;
    }

    throw new Error(`AwsService ${cfnService} is not registered`);
  }

  /**
   * Finds the {@link AwsService} associated with a given value.
   * @param value Value to match {@link AwsService}, which can be `id`, `assetKey`, `fullName`, etc.
   * @returns Returns matching {@link AwsService} or `undefined` if not found
   * @throws Error if service not found
   */
  static findService(value: string): AwsService | undefined {
    if (this._instanceMap.has(value as any)) {
      return this._instanceMap.get(value as any)!;
    }

    for (const instance of this._instanceMap.values()) {
      if (instance._assetKey === value || instance.fullName === value) {
        return instance;
      }
    }

    return;
  }

  /** @internal */
  private static _instanceMap: Map<CfnSpec.ServiceName, AwsService> = new Map();

  /**
   * Get record of all {@link AwsService}s keyed by `id`
   */
  static get services(): TAwsServiceDict {
    return Object.fromEntries(this._instanceMap.entries()) as any;
  }

  /**
   * The category the service belongs to, or undefined if does not belong to a category.
   */
  readonly category?: AwsCategory;
  /**
   * The CloudFormation "provider" for the service, as expressed by `<provicer>::<service>::<resource>`.
   */
  readonly cfnProvider: string;
  /**
   * The CloudFormation "service" for the service, as expressed by `<provicer>::<service>::<resource>`.
   */
  readonly cfnService: string;
  /**
   * Drawio shape associated with this service, or undefined if service not mapped to draiwio shape.
   */
  readonly drawioShape?: DrawioSpec.Aws4.ShapeNames;
  /**
   * The pricing `serviceCode` associated with this service, or undefined if service not mapped to pricing.
   */
  readonly pricingServiceCode?: PricingManifest.ServiceCode;

  /** @internal */
  private readonly _assetKey?: string;
  /** @internal */
  private readonly _assetIcon?: string;
  /** @internal */
  private _drawioStyle?: AwsDrawioResourceIconStyle | null;

  /** @internal */
  private _resources?: AwsResource[];

  /** @internal */
  private constructor(
    cfnKey: CfnSpec.ServiceName,
    cfnMapped: CfnMappedService
  ) {
    this.cfnService = cfnKey;
    this.cfnProvider = cfnMapped.provider;

    if (cfnMapped.assetKey) {
      this._assetKey = cfnMapped.assetKey;
      const _parsed = parseAssetPath(AwsAsset.Services[cfnMapped.assetKey]);
      this._assetIcon = _parsed.service && AwsAsset.Services[_parsed.service];
      this.category = AwsCategory.getCategory(_parsed.category);
    }

    this.pricingServiceCode = cfnMapped.pricingServiceCode;

    this.drawioShape = cfnMapped.drawioShape;
  }

  /**
   * The proper full name of the service.
   *
   * @example "AWS Glue", "Amazon S3"
   */
  get fullName(): string {
    if (this.pricingMetadata) {
      return this.pricingMetadata.name;
    }
    if (this._assetKey) {
      return AwsAsset.AssetFullNameLookup[this._assetKey as AwsAsset.Service];
    }

    return this.cfnService;
  }

  /**
   * Get relative asset icon for the service for a given format and optional theme.
   * @param {IconFormats} format - The format of icon.
   * @param {ThemesEnum} [theme] - Optional theme
   * @returns Returns relative asset icon path
   */
  icon(format: IconFormats, theme?: ThemesEnum): string | undefined {
    if (!this._assetIcon) return undefined;
    try {
      return AwsArchitecture.formatAssetPath(this._assetIcon, format, theme);
    } catch {}

    return;
  }

  /**
   * Get drawio style for this service
   */
  drawioStyle(): AwsDrawioResourceIconStyle | undefined {
    // compute on first access
    if (this._drawioStyle === undefined) {
      if (this.category && this.category.drawioStyles && this.drawioShape) {
        this._drawioStyle = this.category.drawioStyles.getServiceStyle(
          this.drawioShape
        );
      } else {
        // prevent recomputation
        this._drawioStyle = null;
      }
    }

    return this._drawioStyle || undefined;
  }

  /**
   * List all resources of this service
   */
  serviceResources(): AwsResource[] {
    if (this._resources == null) {
      this._resources = Object.values(AwsResource.resources).filter(
        (resource) => resource.service === this
      );
    }

    return this._resources;
  }

  /**
   * Get service pricing metadata.
   */
  get pricingMetadata(): PricingManifest.Service | undefined {
    return (
      this.pricingServiceCode &&
      PricingManifest.Services[this.pricingServiceCode]
    );
  }
}

// Register all services
for (const [cfnKey, mapping] of Object.entries(AwsServiceMapping)) {
  AwsService._register(
    cfnKey as CfnSpec.ServiceName,
    mapping as CfnMappedService
  );
}

/**
 * Type for resource dictionary.
 */
export type TAwsResourceDict = { [key: string]: AwsResource };

/**
 * AwsResource class provides an interface for normalizing resource metadata
 * between mapped systems.
 */
export class AwsResource {
  /** @internal */
  static _register(
    cfnResourceType: CfnSpec.ResourceType,
    cfnMapped: CfnMappedResource
  ): AwsResource {
    const instance = new AwsResource(cfnResourceType, cfnMapped);
    this._instanceMap.set(cfnResourceType, instance);
    return instance;
  }

  /**
   * Get {@link AwsResource} by CloudFormation resource type.
   * @param cfnResourceType - Fully qualifief CloudFormation resource type (eg: AWS:S3:Bucket)
   * @throws Error is no resource found
   */
  static getResource(cfnResourceType: CfnSpec.ResourceType): AwsResource {
    if (this._instanceMap.has(cfnResourceType)) {
      return this._instanceMap.get(cfnResourceType)!;
    }

    throw new Error(`AwsResource ${cfnResourceType} is not registered`);
  }

  /**
   * Find {@link AwsResource} associated with given value.
   * @param value - The value to match {@link AwsResource}; can be id, asset key, full name, etc.
   * @throws Error is no resource found
   */
  static findResource(value: string): AwsResource | undefined {
    if (this._instanceMap.has(value as any)) {
      return this._instanceMap.get(value as any)!;
    }

    for (const instance of this._instanceMap.values()) {
      if (instance._assetKey === value || instance.fullName === value) {
        return instance;
      }
    }

    throw new Error(`AwsService ${value} is not registered`);
  }

  /** @internal */
  private static _instanceMap: Map<CfnSpec.ResourceType, AwsResource> =
    new Map();

  /**
   * Get record of all resources keyed by resource id.
   */
  static get resources(): TAwsResourceDict {
    return Object.fromEntries(this._instanceMap.entries()) as any;
  }

  /**
   * Fully-qualified CloudFormation resource type (eg: "AWS:S3:Bucket")
   */
  readonly cfnResourceType: CfnSpec.ResourceType;
  /**
   * The {@link AwsService} the resource belongs to.
   */
  readonly service: AwsService;
  /**
   * The proper full name of the resource.
   *
   * @example "Bucket", "Amazon S3 on Outposts"
   */
  readonly fullName?: string;
  /**
   * The drawio shape mapped to this resource, or undefined if no mapping.
   */
  readonly drawioShape?: DrawioSpec.Aws4.ShapeNames;

  /** @internal */
  private readonly _serviceIcon?: string;
  /** @internal */
  private readonly _assetIcon?: string;
  /** @internal */
  private readonly _assetKey?: string;
  /** @internal */
  private readonly _generalIcon?: string;
  /** @internal */
  private _drawioStyle?: AwsDrawioShapeStyle | null;

  /** @internal */
  private constructor(
    cfnResourceType: CfnSpec.ResourceType,
    cfnMapped: CfnMappedResource
  ) {
    this.cfnResourceType = cfnResourceType;
    this.service = AwsService.getService(cfnMapped.service);

    if (cfnMapped.assetKey) {
      this._assetKey = cfnMapped.assetKey;
      this._assetIcon = AwsAsset.Resources[cfnMapped.assetKey];

      this.fullName = AwsAsset.AssetFullNameLookup[cfnMapped.assetKey];
    }

    if (cfnMapped.serviceAssetKey) {
      this._serviceIcon = AwsAsset.Services[cfnMapped.serviceAssetKey];
    }

    if (cfnMapped.generalIconKey) {
      this._generalIcon = AwsAsset.GeneralIcons[cfnMapped.generalIconKey];
    }

    this.drawioShape = cfnMapped.drawioShape || cfnMapped.drawioGeneralShape;
  }

  /**
   * Gets the service icon for the resource.
   *
   * This maybe different than {@link AwsResource.service.icon} based on mappings overrides, which
   * if do not exist will fallback to {@link AwsResource.service.icon}.
   *
   * @param {IconFormats} format - The format of icon.
   * @param {ThemesEnum} [theme] - Optional theme
   * @returns Returns relative asset icon path
   *
   * @see {@link AwsService.icon}
   */
  getServiceIcon(format: IconFormats, theme?: ThemesEnum): string | undefined {
    if (this._serviceIcon) {
      try {
        return AwsArchitecture.formatAssetPath(
          this._serviceIcon,
          format,
          theme
        );
      } catch {}
    }

    return this.service.icon(format, theme);
  }

  /**
   * Gets the resource specific icon for the resource.
   * @param {IconFormats} format - The format of icon.
   * @param {ThemesEnum} [theme] - Optional theme
   * @returns Returns relative asset icon path
   */
  getResourceIcon(format: IconFormats, theme?: ThemesEnum): string | undefined {
    if (!this._assetIcon) return undefined;
    try {
      return AwsArchitecture.formatAssetPath(this._assetIcon, format, theme);
    } catch {}

    return;
  }

  /** @internal */
  private _getGeneralIcon(
    format: IconFormats,
    theme?: ThemesEnum
  ): string | undefined {
    if (!this._generalIcon) return undefined;
    try {
      return AwsArchitecture.formatAssetPath(this._generalIcon, format, theme);
    } catch {}

    return;
  }

  /**
   * Gets the best icon match for the resource following the order of:
   * 1. explicit resource icon
   * 2. general icon
   * 3. service icon
   * @param {IconFormats} format - The format of icon.
   * @param {ThemesEnum} [theme] - Optional theme
   * @returns Returns relative asset icon path
   */
  icon(format: IconFormats, theme?: ThemesEnum): string | undefined {
    return (
      this.getResourceIcon(format, theme) ||
      this._getGeneralIcon(format, theme) ||
      this.getServiceIcon(format, theme)
    );
  }

  /**
   * Gets the draiwio style for the resource.
   */
  drawioStyle(): AwsDrawioShapeStyle | undefined {
    // compute on first access
    if (this._drawioStyle === undefined) {
      if (
        this.service.category &&
        this.service.category.drawioStyles &&
        this.drawioShape
      ) {
        this._drawioStyle = this.service.category.drawioStyles.getResourceStyle(
          this.drawioShape
        );
      } else {
        // prevent recomputation
        this._drawioStyle = null;
      }
    }

    return this._drawioStyle || undefined;
  }
}

// Register all resources
for (const [cfnKey, mapping] of Object.entries(AwsResourceMapping)) {
  AwsResource._register(
    cfnKey as CfnSpec.ResourceType,
    mapping as CfnMappedResource
  );
}

/**
 * AwsArchitecture provides an interface for retrieving the inferred normalization between [@aws-cdk/cfnspec](https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/cfnspec)
 * and [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) systems
 * for all CloudFormation "services" and "resources".
 */
export class AwsArchitecture {
  /**
   * The absolute directory where [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)
   * are stored and retrieved.
   */
  static get assetDirectory(): string {
    if (this._assetDirectory == null) {
      this._assetDirectory = path.join(__dirname, "..", ASSET_DIRNAME);
    }
    return this._assetDirectory;
  }
  /**
   * Get all categories
   * @see {@link AwsCategory.categories}
   */
  static get categories(): TAwsCategoryDict {
    return AwsCategory.categories;
  }
  /**
   * Get all services
   * @see {@link AwsService.services}
   */
  static get services(): TAwsServiceDict {
    return AwsService.services;
  }
  /**
   * Get all resources
   * @see {@link AwsResource.resources}
   */
  static get resources(): TAwsResourceDict {
    return AwsResource.resources;
  }

  /**
   * Get specific category based on id
   * @see {@link AwsCategory.getCategory}
   */
  static getCategory(category: AwsCategoryId): AwsCategory {
    return AwsCategory.getCategory(category);
  }

  /**
   * Get specific service based on identifier (eg: S3, AWS::S3, AWS::S3::Bucket)
   * @see {@link AwsSerfice.getService}
   */
  static getService(identifier: string): AwsService {
    if (identifier.includes("::")) {
      identifier = identifier.split("::")[1];
    }

    return AwsService.getService(identifier as CfnSpec.ServiceName);
  }

  /**
   * Get resource based on Cfn Resource Type (eg: AWS::S3::Bucket)
   * @see {@link AwsResource.getResource}
   */
  static getResource(cfnType: CfnSpec.ResourceType): AwsResource {
    return AwsResource.getResource(cfnType);
  }

  /**
   * Get icon for EC2 instance type.
   * @param instanceType - The {@link AwsAsset.InstanceType} to get icon for
   * @param {IconFormats} format - The format of icon.
   * @param {ThemesEnum} [theme] - Optional theme
   * @returns Returns relative asset icon path
   */
  static getInstanceTypeIcon(
    instanceType: AwsAsset.InstanceType,
    format: "png" | "svg" = "png",
    theme?: ThemesEnum
  ): string {
    return this.formatAssetPath(
      AwsAsset.InstanceTypes[instanceType],
      format,
      theme
    );
  }

  /**
   * Resolve relative asset path to absolute asset path.
   * @param assetPath - The relative asset path to resolve.
   * @returns {string} Absolute asset path
   */
  static resolveAssetPath(assetPath: string): string {
    if (assetPath == null)
      throw new Error("Failed to resolve undefined asset path");
    return path.join(AwsArchitecture.assetDirectory, assetPath);
  }

  /**
   * Gets formatted asset path including extension and theme.
   * @param qualifiedAssetKey The qualified asset key (eg: compute/ec2/service_icon, storage/s3/bucket)
   * @param format {IconFormats} The format to return (eg: png, svg)
   * @param theme {ThemesEnum} - (Optional) The theme to use, if not specific or now matching asset for the them, the default theme is used
   * @returns Relative asset file path
   */
  static formatAssetPath(
    qualifiedAssetKey: string,
    format: IconFormats,
    theme?: ThemesEnum
  ): string {
    if (theme && theme !== themes.DefaultThemeId) {
      const themedIcon = `${qualifiedAssetKey}.${theme}.${format}`;
      if (AwsAsset.AssetFiles.has(themedIcon)) {
        return themedIcon;
      }
    }

    const icon = `${qualifiedAssetKey}.${format}`;
    if (AwsAsset.AssetFiles.has(icon)) {
      return icon;
    }

    throw new Error(`Invalid asset key "${qualifiedAssetKey}"`);
  }

  /** @internal */
  private static _assetDirectory?: string;

  private constructor() {}
}
