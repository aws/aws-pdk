/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  PRICING_MANIFEST,
  PRICING_SLUGS,
} from "../../generated/pricing-manifest";
import { normalizeComparisonString } from "../../utils";

/** Service pricing manifest namespace */
export namespace PricingManifest {
  /** Literal union of all service code values */
  export type ServiceCode = keyof typeof PRICING_MANIFEST;

  /** Literal union of all service slug values */
  export type Slug = (typeof PRICING_SLUGS)[number];

  /** Set of service slugs */
  export const Slugs = new Set<Slug>(PRICING_SLUGS);

  /** Pricing manifest service definition */
  export interface Service {
    /**
     * Proper full name of the service
     * @example "Amazon API Gateway"
     */
    readonly name: string;
    /**
     * Unique code for service definition in pricing manifest
     * @example "amazonApiGateway"
     */
    readonly serviceCode: ServiceCode;
    /**
     * Service descriptoin
     * @example "Amazon API Gateway is a fully managed service that..."
     */
    readonly description: string;
    /**
     * List of keywords for searching services
     * @example ["API", "api", "Rest", "websocket", "messages"]
     */
    readonly searchKeywords: string[];
    /**
     * Type of service definition
     * @example "AWSService"
     */
    readonly type: string;

    /**
     * Sub type of service definition
     * @example "subService"
     */
    readonly subType?: "subService" | "subServiceSelector";

    /**
     * List of regions where the service is available.
     * @example ["us-gov-west-1","us-gov-east-1","af-south-1","ap-east-1","ap-south-1","ap-northeast-2","ap-northeast-3",...]
     */
    readonly regions: string[];
    /**
     * Url link to related product documentation
     * @example "https://aws.amazon.com/api-gateway/"
     */
    readonly linkUrl?: string;
    /**
     * @example "true"
     */
    readonly isActive: string;
    /**
     * @example false
     */
    readonly disableConfigure?: boolean;
    /**
     * @example "https://d1qsjq9pzbk1k6.cloudfront.net/data/amazonApiGateway/en_US.json"
     */
    readonly serviceDefinitionLocation: string;
    /**
     * @example false
     */
    readonly c2e?: boolean;
    /**
     * @example false
     * @variation MVPSupport
     */
    readonly mvpSupport?: boolean;
    /**
     * @example ["chimeCostAnalysis", "chimeBusinessCallingAnalysis"]
     */
    readonly templates?: string[];
    /**
     * @example false
     */
    readonly disableRegionSupport?: boolean;
    /**
     * Unique slug for given resource.
     * @example "APIGateway"
     */
    readonly slug?: Slug;

    /**
     * @example true
     */
    readonly bulkImportEnabled?: boolean;

    /**
     * @example false
     */
    readonly hasDataTransfer?: boolean;

    /**
     * List of normalized comparable terms to consider equivalent to this service.
     *
     * Used for lookups and matching between systems.
     * @virtual
     */
    readonly comparableTerms: string[];

    /**
     * Service code of the parent for `subService` services.
     * @virtual
     */
    readonly parentServiceCode?: ServiceCode;
  }

  /** Record of services keyed by service code */
  export type IServiceDict = { [K in ServiceCode]: Service };

  /** Record of all services defined in pricing manifest */
  export const Services = PRICING_MANIFEST as unknown as IServiceDict;

  const _ComparableTermCache = new Map<string, Service>(
    Object.values(Services).flatMap((service) => {
      return service.comparableTerms.map((term) => [term, service]);
    })
  );

  /**
   * Find pricing service definition associated with a given term.
   */
  export function findService(term: string): Service | undefined {
    // check if term is serviceCode
    if (term in Services) {
      return Services[term as ServiceCode];
    }

    term = normalizeComparisonString(term);

    if (_ComparableTermCache.has(term)) {
      return _ComparableTermCache.get(term);
    }

    return;
  }
}
