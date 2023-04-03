/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { writeFile } from "projen/lib/util";
import { ConstructGenerationArguments } from "../types";

export const generateJavaTypeSafeCdkConstruct = (
  options: ConstructGenerationArguments
) => {
  // Write the parsed spec to the resources directory, so it can be packaged into the jar
  writeFile(
    path.join(options.resourcePath, ".api.json"),
    fs.readFileSync(options.specPath, "utf-8"),
    { readonly: true }
  );
  writeFile(
    path.join(options.sourcePath, "ApiProps.java"),
    `package ${options.infraPackage};

import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.apigateway.RestApiBaseProps;
import software.amazon.awscdk.services.apigateway.DomainNameOptions;
import software.amazon.awscdk.services.apigateway.EndpointType;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.aws.awsprototypingsdk.typesafeapi.Authorizer;
import software.aws.awsprototypingsdk.typesafeapi.TypeSafeApiIntegration;

import ${options.generatedTypesPackage}.api.OperationConfig;

import java.util.List;
import java.util.Map;

/**
 * Properties for the Api construct
 */
@lombok.Builder @lombok.Getter
public class ApiProps implements RestApiBaseProps {
    public OperationConfig<TypeSafeApiIntegration> integrations;
    public Authorizer defaultAuthorizer;
    public CorsOptions corsOptions;

    // Rest API Props
    public Boolean cloudWatchRole;
    public Boolean deploy;
    public StageOptions deployOptions;
    public String description;
    public Boolean disableExecuteApiEndpoint;
    public DomainNameOptions domainName;
    public String endpointExportName;
    public List<EndpointType> endpointTypes;
    public Boolean failOnWarnings;
    public Map<String, String> parameters;
    public PolicyDocument policy;
    public String restApiName;
    public Boolean retainDeployments;
}
`,
    { readonly: true }
  );

  writeFile(
    path.join(options.sourcePath, "Api.java"),
    `package ${options.infraPackage};

import com.fasterxml.jackson.databind.ObjectMapper;
import software.aws.awsprototypingsdk.typesafeapi.MethodAndPath;
import software.aws.awsprototypingsdk.typesafeapi.TypeSafeRestApi;
import software.aws.awsprototypingsdk.typesafeapi.TypeSafeRestApiProps;
import software.constructs.Construct;
import ${options.generatedTypesPackage}.api.OperationLookup;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Type-safe construct for the API Gateway resources defined by your model.
 * This construct is generated and should not be modified.
 */
public class Api extends TypeSafeRestApi {
    private static class SpecDetails {
        static String specPath;

        static {
            try {
                // The parsed spec is included as a packaged resource
                URL specUrl = SpecDetails.class.getClassLoader().getResource(".api.json");

                // We'll write the parsed spec to a temporary file outside of the jar to ensure CDK can package it as an asset
                Path parsedSpecPath = Files.createTempFile("type-safe-api", ".json");
                specPath = parsedSpecPath.toString();

                ObjectMapper json = new ObjectMapper();
                Object spec = json.readValue(specUrl, Object.class);
                json.writeValue(parsedSpecPath.toFile(), spec);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    public Api(Construct scope, String id, ApiProps props) {
        super(scope, id, TypeSafeRestApiProps.builder()
                .defaultAuthorizer(props.getDefaultAuthorizer())
                .corsOptions(props.getCorsOptions())
                .operationLookup(OperationLookup.getOperationLookup()
                        .entrySet()
                        .stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> MethodAndPath.builder()
                                .method(e.getValue().get("method"))
                                .path(e.getValue().get("path"))
                                .build())))
                .specPath(SpecDetails.specPath)
                .integrations(props.getIntegrations().asMap())
                // Rest API Base Props
                .cloudWatchRole(props.getCloudWatchRole())
                .deploy(props.getDeploy())
                .deployOptions(props.getDeployOptions())
                .description(props.getDescription())
                .disableExecuteApiEndpoint(props.getDisableExecuteApiEndpoint())
                .domainName(props.getDomainName())
                .endpointExportName(props.getEndpointExportName())
                .endpointTypes(props.getEndpointTypes())
                .failOnWarnings(props.getFailOnWarnings())
                .parameters(props.getParameters())
                .policy(props.getPolicy())
                .restApiName(props.getRestApiName())
                .retainDeployments(props.getRetainDeployments())
                .build());
    }
}
`,
    { readonly: true }
  );
};
