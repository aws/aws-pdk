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
import * as fs from "fs-extra";
import { omit } from "lodash";
import { AwsArchitecture, AwsCategory, AwsResource, AwsService } from "../src";
import { CfnSpec } from "../src/generated/cfnspec";
import { AwsCategoryDefinitions } from "../src/internal/categories/definitions";

describe("arch", () => {
  describe("categories", () => {
    it("should register all categories", () => {
      expect(AwsArchitecture.categories).toEqual(AwsCategory.categories);
      expect(Object.keys(AwsCategory.categories).length).toEqual(
        Object.keys(AwsCategoryDefinitions).length
      );
    });

    it("should resolve relative asset icons to absolute", async () => {
      const assetDirectory = AwsArchitecture.assetDirectory;
      const relativeIcon =
        AwsArchitecture.getCategory("analytics").icon("png")!;
      const absoluteIcon = AwsArchitecture.resolveAssetPath(relativeIcon);
      expect(path.isAbsolute(relativeIcon)).toBe(false);
      expect(path.isAbsolute(absoluteIcon)).toBe(true);
      expect(absoluteIcon.startsWith(assetDirectory)).toBe(true);
      expect(absoluteIcon.endsWith(relativeIcon)).toBe(true);
      expect(await fs.pathExists(absoluteIcon)).toBeTruthy();
    });

    it("should failed if missing", () => {
      expect(() =>
        AwsArchitecture.getCategory("NOT EXISTING" as any)
      ).toThrow();
    });

    it.each(Object.values(AwsArchitecture.categories))("%s", (category) => {
      const _category = AwsArchitecture.getCategory(category.id);
      expect(_category).toBe(category);
      expect({
        category: omit(_category, ["_services"]),
        services: _category
          .categoryServices()
          .map((service) => service.cfnService),
      }).toMatchSnapshot();
    });
  });

  describe("services", () => {
    it("should expose generated AwsServices mapping", () => {
      expect(AwsArchitecture.services).toEqual(AwsService.services);
    });

    it("should resolve relative asset icons to absolute", async () => {
      const assetDirectory = AwsArchitecture.assetDirectory;
      const relativeIcon = AwsArchitecture.getService(
        "S3" as CfnSpec.ServiceName
      ).icon("png")!;
      const absoluteIcon = AwsArchitecture.resolveAssetPath(relativeIcon);
      expect(path.isAbsolute(relativeIcon)).toBe(false);
      expect(path.isAbsolute(absoluteIcon)).toBe(true);
      expect(absoluteIcon.startsWith(assetDirectory)).toBe(true);
      expect(absoluteIcon.endsWith(relativeIcon)).toBe(true);
      expect(await fs.pathExists(absoluteIcon)).toBeTruthy();
    });

    it("should failed if missing", () => {
      expect(() => AwsArchitecture.getService("NOT EXISTING")).toThrow();
    });

    it.each(Object.values(CfnSpec.ServiceNames))("%s", (serviceName) => {
      const service = AwsArchitecture.getService(serviceName);
      expect(service).toBeDefined();
      expect(service).toBe(AwsArchitecture.getService(`AWS::${serviceName}`));
      expect({
        service: omit(service, ["category", "_resources"]),
        resources: service
          .serviceResources()
          .map((resource) => resource.cfnResourceType),
      }).toMatchSnapshot();
    });
  });

  describe("resources", () => {
    it("should expose generated AwsResources mapping", () => {
      expect(AwsArchitecture.resources).toEqual(AwsResource.resources);
    });

    it("should resolve relative asset icons to absolute", async () => {
      const assetDirectory = AwsArchitecture.assetDirectory;
      const relativeIcon = AwsArchitecture.getResource(
        "AWS::S3::Bucket" as CfnSpec.ResourceType
      ).icon("png")!;
      const absoluteIcon = AwsArchitecture.resolveAssetPath(relativeIcon);
      expect(path.isAbsolute(relativeIcon)).toBe(false);
      expect(path.isAbsolute(absoluteIcon)).toBe(true);
      expect(absoluteIcon.startsWith(assetDirectory)).toBe(true);
      expect(absoluteIcon.endsWith(relativeIcon)).toBe(true);
      expect(await fs.pathExists(absoluteIcon)).toBeTruthy();
    });

    it("should failed if missing", () => {
      expect(() =>
        AwsArchitecture.getResource("NOT EXISTING" as any)
      ).toThrow();
    });

    it.each(Object.values(CfnSpec.ResourceTypes))("%s", (resourceName) => {
      const resource = AwsArchitecture.getResource(resourceName);
      expect(resource).toBeDefined();
      expect(omit(resource, "service")).toMatchSnapshot();
    });
  });
});
