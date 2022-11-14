/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
export interface JavaSampleCodeOptions {
  /**
   * The package name which exports the OpenApiGatewayRestApi construct (ie this pdk package!)
   */
  readonly openApiGatewayPackageName: string;
  /**
   * Whether or not to generate sample code
   */
  readonly sampleCode?: boolean;
  /**
   * Api source code directory, relative to the project root
   */
  readonly apiSrcDir: string;
  /**
   * Directory where the parsed spec is output
   */
  readonly specDir: string;
  /**
   * Name of the parsed spec file
   */
  readonly parsedSpecFileName: string;
  /**
   * The package from which to import generated java client classes
   */
  readonly javaClientPackage: string;
}

export const getJavaSampleSource = (
  options: JavaSampleCodeOptions
): { [fileName: string]: string } => {
  const apiPackage = options.apiSrcDir.split("/").join(".");

  return {
    "ApiProps.java": `package ${apiPackage};

import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.apigateway.RestApiBaseProps;
import software.amazon.awscdk.services.apigateway.DomainNameOptions;
import software.amazon.awscdk.services.apigateway.EndpointType;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.aws.awsprototypingsdk.openapigateway.Authorizer;
import software.aws.awsprototypingsdk.openapigateway.OpenApiIntegration;

import ${options.javaClientPackage}.api.OperationConfig;

import java.util.List;
import java.util.Map;

/**
 * Properties for the Api construct
 */
@lombok.Builder @lombok.Getter
public class ApiProps implements RestApiBaseProps {
    public OperationConfig<OpenApiIntegration> integrations;
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
    "Api.java": `package ${apiPackage};

import com.fasterxml.jackson.databind.ObjectMapper;
import software.aws.awsprototypingsdk.openapigateway.MethodAndPath;
import software.aws.awsprototypingsdk.openapigateway.OpenApiGatewayRestApi;
import software.aws.awsprototypingsdk.openapigateway.OpenApiGatewayRestApiProps;
import software.constructs.Construct;
import ${options.javaClientPackage}.api.OperationLookup;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Type-safe construct for the API Gateway resources defined by the spec.
 * You will likely not need to modify this file, and can instead extend it and define your integrations.
 */
public class Api extends OpenApiGatewayRestApi {
    private static class SpecDetails {
        static String specPath;
        static Object spec;

        static {
            try {
                // The parsed spec is included as a packaged resource
                URL specUrl = SpecDetails.class.getClassLoader().getResource("${options.specDir}/${options.parsedSpecFileName}");

                // We'll write the parsed spec to a temporary file outside of the jar to ensure CDK can package it as an asset
                Path parsedSpecPath = Files.createTempFile("parsed-spec", ".json");
                specPath = parsedSpecPath.toString();

                ObjectMapper json = new ObjectMapper();
                spec = json.readValue(specUrl, Object.class);
                json.writeValue(parsedSpecPath.toFile(), spec);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    public Api(Construct scope, String id, ApiProps props) {
        super(scope, id, OpenApiGatewayRestApiProps.builder()
                .defaultAuthorizer(props.getDefaultAuthorizer())
                .corsOptions(props.getCorsOptions())
                .operationLookup(OperationLookup.getOperationLookup()
                        .entrySet()
                        .stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> MethodAndPath.builder()
                                .method(e.getValue().get("method"))
                                .path(e.getValue().get("path"))
                                .build())))
                .spec(SpecDetails.spec)
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
    ...(options.sampleCode !== false
      ? {
          "SayHelloHandler.java": `package ${apiPackage};

import ${options.javaClientPackage}.api.Handlers.SayHello;
import ${options.javaClientPackage}.api.Handlers.SayHello200Response;
import ${options.javaClientPackage}.api.Handlers.SayHelloRequestInput;
import ${options.javaClientPackage}.api.Handlers.SayHelloResponse;
import ${options.javaClientPackage}.model.SayHelloResponseContent;

/**
 * An example lambda handler which uses the generated handler wrapper class (Handlers.SayHello) to manage marshalling
 * inputs and outputs.
 */
public class SayHelloHandler extends SayHello {
    @Override
    public SayHelloResponse handle(SayHelloRequestInput sayHelloRequestInput) {
        return SayHello200Response.of(SayHelloResponseContent.builder()
                .message(String.format("Hello %s", sayHelloRequestInput.getInput().getRequestParameters().getName()))
                .build());
    }
}
`,
          "SampleApi.java": `package ${apiPackage};

import software.amazon.awscdk.Duration;
import software.amazon.awscdk.services.apigateway.CorsOptions;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.FunctionProps;
import software.amazon.awscdk.services.lambda.Runtime;
import software.aws.awsprototypingsdk.openapigateway.Authorizers;
import software.aws.awsprototypingsdk.openapigateway.Integrations;
import software.aws.awsprototypingsdk.openapigateway.OpenApiIntegration;
import ${options.javaClientPackage}.api.OperationConfig;
import software.constructs.Construct;

import java.net.URISyntaxException;
import java.util.Arrays;

/**
 * An example of how to wire lambda handler functions to API operations
 */
public class SampleApi extends Api {
    public SampleApi(Construct scope, String id) {
        super(scope, id, ApiProps.builder()
                .defaultAuthorizer(Authorizers.iam())
                .corsOptions(CorsOptions.builder()
                        .allowOrigins(Arrays.asList("*"))
                        .allowMethods(Arrays.asList("*"))
                        .build())
                .integrations(OperationConfig.<OpenApiIntegration>builder()
                        .sayHello(OpenApiIntegration.builder()
                                .integration(Integrations.lambda(
                                        new Function(scope, "say-hello", FunctionProps.builder()
                                                // Use the entire project jar for the lambda code in order to provide a simple,
                                                // "one-click" way to build the api. However this jar is much larger than necessary
                                                // since it includes cdk infrastructure, dependencies etc.
                                                // It is recommended to follow the instructions in the "Java API Lambda Handlers"
                                                // section of the open-api-gateway README to define your lambda handlers as a
                                                // separate project.
                                                .code(Code.fromAsset(SampleApi.getJarPath()))
                                                .handler("${apiPackage}.SayHelloHandler")
                                                .runtime(Runtime.JAVA_11)
                                                .timeout(Duration.seconds(30))
                                                .build())))
                                .build())
                        .build())
                .build());
    }

    private static String getJarPath() {
        try {
            // Retrieve the path of the jar in which this class resides
            return SampleApi.class.getProtectionDomain().getCodeSource().getLocation().toURI().getPath();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
    }
}

`,
        }
      : {}),
  };
};
