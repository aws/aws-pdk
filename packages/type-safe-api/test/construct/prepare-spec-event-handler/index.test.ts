/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import _ from "lodash";
import { ApiGatewayIntegration } from "../../../src/construct/integrations";
import {
  PrepareApiSpecCustomResourceProperties,
  ensurePrimitiveTypes,
} from "../../../src/construct/prepare-spec-event-handler";
import { DefaultAuthorizerIds } from "../../../src/construct/prepare-spec-event-handler/constants";
import { SerialisedAuthorizerReference } from "../../../src/construct/spec/api-gateway-auth";

type DeepRequired<T> = T extends Array<infer U>
  ? [DeepRequired<U>, ...DeepRequired<U>[]]
  : T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

describe("prepare-spec-event-handler index.ts", () => {
  /**
   * Since CloudFormation has a bug where it coerces primitive types to strings, we include this test to ensure that our custom
   * event handler coerces them back.
   * To attempt to ensure that we don't introduce new properties that aren't covered, we define an example payload for the
   * custom resource where all properties are recursively required, so that the build will fail if this test isn't updated with
   * an example value of that property.
   */
  describe("ensurePrimitiveTypes", () => {
    const mockIntegration: DeepRequired<ApiGatewayIntegration> = {
      type: "AWS_PROXY",
      uri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:my-function/invocations",
      cacheKeyParameters: ["method.request.path.id"],
      cacheNamespace: "test-namespace",
      connectionId: "test-connection-id",
      connectionType: "INTERNET",
      credentials: "arn:aws:iam::123456789012:role/test-role",
      contentHandling: "CONVERT_TO_TEXT",
      httpMethod: "POST",
      passthroughBehavior: "WHEN_NO_MATCH",
      requestParameters: {
        "integration.request.path.id": "method.request.path.id",
      },
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
      responses: {
        default: {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": "'application/json'",
          },
          responseTemplates: {
            "application/json": '{"message": "Success"}',
          },
          contentHandling: "CONVERT_TO_TEXT",
        },
      },
      timeoutInMillis: 29000,
      tlsConfig: {
        insecureSkipVerification: false,
      },
    };

    const mockAuthorizerRef: DeepRequired<SerialisedAuthorizerReference> = {
      authorizerId: DefaultAuthorizerIds.IAM,
      authorizationScopes: ["read", "write"],
    };

    const exampleOptions: DeepRequired<PrepareApiSpecCustomResourceProperties> =
      {
        inputSpecLocation: {
          bucket: "input-bucket",
          key: "input-key",
        },
        outputSpecLocation: {
          bucket: "output-bucket",
          key: "output-key",
        },
        integrations: {
          getItem: {
            integration: mockIntegration,
            methodAuthorizer: mockAuthorizerRef,
            options: {
              apiKeyRequired: true, // Boolean property that might be converted to string
            },
          },
          deleteItem: {
            integration: mockIntegration,
            methodAuthorizer: mockAuthorizerRef,
            options: {
              apiKeyRequired: false, // Boolean property that might be converted to string
            },
          },
        },
        corsOptions: {
          allowMethods: ["GET", "POST"],
          allowHeaders: ["Content-Type", "Authorization"],
          allowOrigins: ["*"],
          statusCode: 200, // Number property that might be converted to string
        },
        operationLookup: {
          getItem: {
            path: "/items/{id}",
            method: "get",
            contentTypes: ["application/json"],
          },
          deleteItem: {
            path: "/items/{id}",
            method: "delete",
            contentTypes: ["application/json"],
          },
        },
        securitySchemes: {
          "aws.auth.sigv4": {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "description",
          },
        },
        defaultAuthorizerReference: mockAuthorizerRef,
        apiKeyOptions: {
          source: "HEADER",
          requiredByDefault: true, // Boolean property that might be converted to string
        },
      };

    it("should coerce string values back to their appropriate types", () => {
      // Create a deep copy of the example options
      const options = JSON.parse(JSON.stringify(exampleOptions));

      // Keep track of all primitive values and their paths
      const primitiveValues: { path: string; originalValue: any }[] = [];

      // Function to convert all primitive values to strings and track them
      const convertPrimitivesToStrings = (obj: any, path: string = ""): any => {
        if (typeof obj === "number" || typeof obj === "boolean") {
          primitiveValues.push({ path, originalValue: obj });
          return String(obj);
        }

        if (obj === null || obj === undefined || typeof obj !== "object") {
          return obj;
        }

        if (Array.isArray(obj)) {
          return obj.map((item, index) =>
            convertPrimitivesToStrings(item, `${path}[${index}]`)
          );
        }

        return Object.fromEntries(
          Object.entries(obj).map(([key, value]) => {
            return [
              key,
              convertPrimitivesToStrings(value, path ? `${path}.${key}` : key),
            ];
          })
        );
      };

      // Convert all primitive values to strings
      const stringifiedOptions = convertPrimitivesToStrings(options);

      // Apply the ensurePrimitiveTypes function
      const coercedOptions = ensurePrimitiveTypes(stringifiedOptions);

      // Verify that all tracked primitive values were coerced back to their original types
      for (const key in primitiveValues) {
        const { path, originalValue } = primitiveValues[key];
        const coercedValue = _.get(coercedOptions, path);

        try {
          expect(typeof coercedValue).toBe(typeof originalValue);
          expect(coercedValue).toEqual(originalValue);
        } catch (e) {
          throw new Error(
            `Expected value at ${path} to be coerced to ${typeof originalValue}: ${e}`
          );
        }
      }

      // Specifically check some known boolean and number properties
      expect(typeof coercedOptions.apiKeyOptions!.requiredByDefault).toBe(
        "boolean"
      );
      expect(coercedOptions.apiKeyOptions!.requiredByDefault).toBe(true);

      expect(typeof coercedOptions.corsOptions!.statusCode).toBe("number");
      expect(coercedOptions.corsOptions!.statusCode).toBe(200);

      expect(
        typeof coercedOptions.integrations.getItem.options!.apiKeyRequired
      ).toBe("boolean");
      expect(coercedOptions.integrations.getItem.options!.apiKeyRequired).toBe(
        true
      );

      expect(
        typeof coercedOptions.integrations.deleteItem.options!.apiKeyRequired
      ).toBe("boolean");
      expect(
        coercedOptions.integrations.deleteItem.options!.apiKeyRequired
      ).toBe(false);
    });
  });
});
