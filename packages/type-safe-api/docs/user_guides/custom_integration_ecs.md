# Custom Integration Example: ECS and NLB

This guide walks through a practical example of building a custom integration to use Type Safe API with [Elastic Container Service (ECS)](https://aws.amazon.com/ecs/) and a [Network Load Balancer (NLB)](https://aws.amazon.com/elasticloadbalancing/network-load-balancer/).

In this example, we'll use TypeScript with [Express](https://expressjs.com/), but the same idea applies to Java and Python.

## Project Setup

In the usual way, create a monorepo which will be the base of your project:

```bash
mkdir smithy-ecs-workshop
cd smithy-ecs-workshop
npx projen new --from @aws-prototyping-sdk/nx-monorepo
```

## Add a Dependency on Type Safe API

Update your `.projenrc.ts` to add a dependency on `@aws-prototyping-sdk/type-safe-api`:

```ts
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";

const monorepo = new NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: [
    "@aws-prototyping-sdk/nx-monorepo",
    "@aws-prototyping-sdk/type-safe-api" // <- add this!
  ],
  name: "smithy-ecs-workshop",
});

monorepo.synth();
```

Then synthesize your project by running:

```bash
yarn projen
```

Synthesizing your project will generate the projects you have defined in your `.projenrc.ts` file. Changes to project structure and configuration are defined as code. For more details, take a look at the [Projen Documentation](https://github.com/projen/projen).

## Set up the API, Server and Infrastructure Projects

In your `.projenrc.ts`, we’ll add three more projects:

* `TypeSafeApiProject` - this will be used for defining our API and provides generated infrastructure, clients, types and documentation
* `TypeScriptProject` - a basic typescript in which we'll implement our Express server
* `AwsCdkTypeScriptApp` - a simple CDK app for deploying your API quickly. Note that in a production application you'd likely opt for a CI/CD pipeline to manage your deployments (eg `PDKPipelineTsProject`) instead.

```ts
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { Language, ModelLanguage, TypeSafeApiProject } from "@aws-prototyping-sdk/type-safe-api";
import { TypeScriptProject } from "projen/lib/typescript";
import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";

const monorepo = new NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: [
    "@aws-prototyping-sdk/nx-monorepo",
    "@aws-prototyping-sdk/type-safe-api",
  ],
  name: "smithy-ecs-workshop",
});

// Define the API
const api = new TypeSafeApiProject({
  parent: monorepo,
  outdir: "packages/api",
  name: "smithy-ecs-workshop-api",
  model: {
    language: ModelLanguage.SMITHY,
    options: {
      smithy: {
        serviceName: {
          namespace: "com.smithy.ecs",
          serviceName: "Workshop",
        },
      },
    },
  },
  // We select TypeScript as our infrastructure and runtime languages
  infrastructure: {
    language: Language.TYPESCRIPT,
  },
  runtime: {
    languages: [Language.TYPESCRIPT],
  },
});

// Express server project
const server = new TypeScriptProject({
  parent: monorepo,
  outdir: "packages/server",
  name: "smithy-ecs-workshop-server",
  defaultReleaseBranch: "main",
  deps: [
    // Add a dependency on express, and the generated typescript runtime
    "express",
    api.runtime.typescript!.package.packageName!,
  ],
  devDeps: [
    "@types/express",
    "@types/aws-lambda",
    "esbuild",
    "@aws-prototyping-sdk/type-safe-api",
  ],
  tsconfig: {
    compilerOptions: {
      lib: ["dom", "es2019"],
    },
  },
});
server.gitignore.addPatterns('docker-image/*.js');

// Infrastructure project to deploy our API, ECS and NLB
new AwsCdkTypeScriptApp({
  parent: monorepo,
  outdir: "packages/infra",
  name: "smithy-ecs-workshop-infra",
  cdkVersion: "2.0.0",
  defaultReleaseBranch: "main",
  deps: [
    // Add a dependency on type-safe-api, as well as the generated infrastructure, runtime, and the server
    "@aws-prototyping-sdk/type-safe-api",
    api.runtime.typescript!.package.packageName!,
    api.infrastructure.typescript!.package.packageName,
    server.package.packageName!,
  ],
  tsconfig: {
    compilerOptions: {
      lib: ["dom", "es2019"],
    },
  },
});

monorepo.synth();
```

We can now synthesize and build our "empty" suite of projects:

```bash
yarn projen
yarn build
```

## ECS Infrastructure

Inside `packages/infra/src`, let’s define a new file `load-balanced-ecs-service.ts` which will deploy our express service on ECS. This includes a VPC, the service within the VPC private subnet, and a VPC Link for API Gateway to connect to our service within the VPC:

```ts
import { VpcLink } from "aws-cdk-lib/aws-apigateway";
import { Peer, Port, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import { ContainerImage } from "aws-cdk-lib/aws-ecs";
import { NetworkLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { NetworkLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

export class LoadBalancedEcsService extends Construct {
  public readonly lb: NetworkLoadBalancer;
  public readonly vpcLink: VpcLink;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a VPC with public and private subnets
    const vpc = new Vpc(this, "Vpc", {
      subnetConfiguration: [
        {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          name: "private",
        },
        {
          subnetType: SubnetType.PUBLIC,
          name: "public",
        },
      ],
      // NAT Gateways set to 1 to reduce cost for this example, you'd likely use more for better resilience.
      natGateways: 1,
    });

    // Create the ECS service using Fargate and NLB.
    const service = new NetworkLoadBalancedFargateService(this, "FargateNlb", {
      // The service runs within our VPC"s private subnet
      assignPublicIp: false,
      taskSubnets: { subnets: vpc.privateSubnets },
      vpc,
      listenerPort: 80,
      taskImageOptions: {
        image: ContainerImage.fromDockerImageAsset(new DockerImageAsset(this, "Image", {
          directory: "../server/docker-image",
          platform: Platform.LINUX_AMD64,
        })),
        containerPort: 80,
      },
      publicLoadBalancer: false,
    });

    service.service.connections.allowFrom(Peer.ipv4(vpc.vpcCidrBlock), Port.tcp(80));

    this.lb = service.loadBalancer;

    // Create a VPC link for API Gateway to forward requests to the NLB within our VPC
    this.vpcLink = new VpcLink(this, "Link", {
      targets: [this.lb],
    });
  }
}
```

Notice that the docker image points to the server package’s `docker-image` folder. We’ll define this later on!


## Custom Integration

Next, in `packages/infra/src/nlb-integration.ts`, let's define a custom integration which allows us to point API operations to the NLB via the VPC Link:

```ts
import { ApiGatewayIntegration, Integration, IntegrationRenderProps } from "@aws-prototyping-sdk/type-safe-api";
import { IVpcLink } from "aws-cdk-lib/aws-apigateway";
import { INetworkLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";

/**
 * A custom integration used to forward requests to the NLB via the VPC Link
 */
export class NlbIntegration extends Integration {
  private readonly lb: INetworkLoadBalancer;
  private readonly vpcLink: IVpcLink;

  constructor(lb: INetworkLoadBalancer, vpcLink: IVpcLink) {
    super();
    this.lb = lb;
    this.vpcLink = vpcLink;
  }

  /**
   * The "render" method of the integration is responsible for returning a snippet of OpenAPI specification
   * which will be used as the x-amazon-apigateway-integration for a given operation
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      // Type is HTTP Proxy to forward the request to the NLB
      type: "HTTP_PROXY",
      // Include the path (with path parameters eg /foo/{param}) in the url - params are substituted
      // so long as the integration request parameter mapping includes them
      uri: `http://${this.lb.loadBalancerDnsName}${props.path}`,
      // Use the VPC Link for API gateway to connect to the VPC
      connectionId: this.vpcLink.vpcLinkId,
      connectionType: 'VPC_LINK',
      httpMethod: props.method.toUpperCase(),
      requestParameters: {
        // Add the resource path here as an additional integration header, which we'll need for
        // the handler router
        'integration.request.header.x-resource-path': `'${props.path}'`,
        // Add every path parameter to the integration request
        ...Object.fromEntries([
          ...props.path.matchAll(/\{([^\}]*)\}/g),
        ].map(m => m[1]).map(param => [`integration.request.path.${param}`, `method.request.path.${param}`])),
      },
    };
  }
}
```

Note here that we’re adding the resource path as a header. This can then be used to map requests to a particular operation by the handler router, which we'll define later on. We also need to tell API Gateway what path parameters to inject into the request that’s forwarded on to our NLB.

## Create the Api Infrastructure

Next, we'll use the generated `Api` construct to define our API Gateway infrastructure, and use our `NlbIntegration` to point operations at our `LoadBalancedEcsService`.

Edit `packages/infra/src/main.ts`:

```ts
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LoadBalancedEcsService } from "./load-balanced-ecs-service";
import { Api } from "smithy-ecs-workshop-api-typescript-infra";
import { Authorizers } from "@aws-prototyping-sdk/type-safe-api";
import { Operations } from "smithy-ecs-workshop-api-typescript-runtime";
import { NlbIntegration } from "./nlb-integration";

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // Create the service
    const { lb, vpcLink } = new LoadBalancedEcsService(this, "Service");
    
    // Create the API
    new Api(this, "Api", {
      defaultAuthorizer: Authorizers.iam(),
      // Point all operations to the NLB
      integrations: Operations.all({
        integration: new NlbIntegration(lb, vpcLink),
      }),
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'smithy-ecs-workshop-infra-dev', { env: devEnv });

app.synth();
```

## Implement the Express Server

Next we'll implement our express server which will run on ECS.

### Mapping Requests and Responses

First, we'll write some mapping code to allow us to make use of our generated, type safe handler router, even though we're not running on lambda. This will mean the operations we implement will benefit from all the generated types.

To use the handler router, we need to map Express requests to `APIGatewayProxyEvent`s, and `APIGatewayProxyResult`s back to Express responses.  To do this, let's define `mapRequest` and `mapResponse` methods in `packages/server/src/mapper.ts` as follows:

```ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Request, Response } from 'express';

/**
 * Return the path parameters found in the given path, based on the template
 */
const extractPathParameters = (template: string, path: string) => {
  const templateParts = template.split('/');
  const pathParts = path.split('/');

  const pathParameters: { [key: string]: string } = {};

  for (let i = 0; i < templateParts.length; i++) {
    const match = templateParts[i].match(/\{([^\}]*)\}/);
    if (match) {
      pathParameters[match[1]] = pathParts[i];
    }
  }

  return pathParameters;
};

/**
 * Map an express request to an API Gateway Proxy Event
 */
export const mapRequest = (req: Request<{}, any, any, any, Record<string, any>>): APIGatewayProxyEvent => {
  return {
    body: req.body,
    httpMethod: req.method,
    headers: Object.fromEntries(Object.entries(req.headers).filter(([_, v]) => typeof v === 'string') as [string, string][]),
    multiValueHeaders: Object.fromEntries(Object.entries(req.headers).filter(([_, v]) => typeof v !== 'string') as [string, string[]][]),
    queryStringParameters: Object.fromEntries(Object.entries(req.query).filter(([_, v]) => typeof v === 'string') as [string, string][]),
    multiValueQueryStringParameters: Object.fromEntries(Object.entries(req.query).filter(([_, v]) => typeof v !== 'string') as [string, string[]][]),
    path: req.path,
    pathParameters: extractPathParameters(req.headers['x-resource-path']! as string, req.path),
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {
      // The httpMethod and resourcePath are both required by the handler router
      httpMethod: req.method,
      resourcePath: req.headers['x-resource-path']! as string,
      path: req.path,
      // The below context values aren't present in the request by default, but you can map your desired context values to
      // headers in your custom integration if required
      // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html#context-variable-reference
      accountId: "unknown",
      apiId: "unknown",
      protocol: "http",
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: "unknown",
        user: null,
        userAgent: null,
        userArn: null
      },
      stage: "unknown",
      requestId: "unknown",
      requestTimeEpoch: 0,
      resourceId: "unknown",
      authorizer: undefined,
    },
    resource: "unknown",
  };
}

/**
 * Map an API Gateway Proxy Result to an express response
 */
export const mapResponse = (res: Response<any, Record<string, any>>, result: APIGatewayProxyResult): void => {
  res.status(result.statusCode);
  Object.entries(result.headers || {}).forEach(([key, value]) => res.header(`${key}: ${value}`));
  res.send(result.body);
};
```

Note that this may not be a fully comprehensive example - there may be more properties of the request that you need to map, and the path parameter extraction logic is quite basic and may not cover all your use cases!


### Say Hello Operation Implementation

We can implement our operation in `packages/server/src/say-hello.ts` using the generated lambda handler wrapper:

```ts
import { sayHelloHandler } from "smithy-ecs-workshop-api-typescript-runtime";

export const sayHello = sayHelloHandler(async ({ input }) => {
  return {
    statusCode: 200,
    body: {
      message: `Hello ${input.requestParameters.name}`,
    },
  };
});
```

### Implement the Server Entrypoint

We can put the mappers and the generated handler router together in the server entry point in `packages/server/src/index.ts`. This creates the handler router, registering handlers for each operation. It defines a proxy route (`/*`) which uses the router to match requests with the appropriate handler.

```ts
import type { Context } from 'aws-lambda';
import express, { Application } from 'express';
import { mapRequest, mapResponse } from './mapper';
import { handlerRouter } from "smithy-ecs-workshop-api-typescript-runtime";
import { sayHello } from "./say-hello";

const app: Application = express();

// Register handlers here
const router = handlerRouter({
  handlers: {
    sayHello,
  },
});

// Use the mappers and router to direct the request to the appropriate handler
app.all('/*', (req, res) => {
  const event = mapRequest(req);
  router(event, {} as Context)
    .then((result) => mapResponse(res, result))
    .catch((err) => {
      res.status(500);
      res.send(JSON.stringify({ errorMessage: err.message }));
    });
});

app.listen(80, () => {
  console.log('Server is running on port', 80);
});
```

Since you likely deleted the default sample code (ie `class Hello ...`) in `index.ts`, make sure you delete the sample `test/hello.test.ts` file which referenced it!

## Bundle our server

Next, we’ll add a step to our server’s package task in the `.projenrc.ts` file to bundle our server implementation and its dependencies into a single `server.js` file. This will make it easier to package into a docker container.

```ts
const server = new TypeScriptProject({
  ...
});

// Add this next line to build the server into a single server.js file
server.packageTask.exec('esbuild src/index.ts --bundle --platform=node --outfile=docker-image/server.js');
server.gitignore.addPatterns('docker-image/*.js');
```

## Docker File

Let’s create a docker file under `packages/server/docker-image/Dockerfile`:

```dockerfile
FROM node:16

WORKDIR /app
COPY server.js .

EXPOSE 80

CMD ["node", "server.js"]
```

This docker file copies our server implementation, and starts the server up as its launch command.

## Synthesize, Build and Deploy!

Make sure you're running [Docker](https://www.docker.com/) since the deployment will build a docker container.

Since we updated the `.projenrc.ts` we’ll need to synthesize again. After that we can build all the packages again.

```bash
yarn projen
yarn build
```

After you have set up AWS credentials for your target AWS account (eg. run `aws configure`), you can deploy the CDK application:

```bash
yarn nx run smithy-ecs-workshop-infra:deploy --require-approval never
```

Once the deployment has completed, you'll see your API URL printed as a CloudFormation output.

Since we used IAM (Sigv4) authentication for our API, we'll need to sign requests to our API. You can use [awscurl](https://github.com/okigan/awscurl) as an easy way to call it from your command line:

```bash
awscurl --service execute-api --region <your-aws-region> \
  https://your-api-gateway.your-aws-region.amazonaws.com/prod/hello?name=World
```
